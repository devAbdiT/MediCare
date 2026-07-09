// app/api/pharmacy/dispense/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { startOfDay, endOfDay } from "date-fns";
import { createAuditLog } from "@/lib/audit";

// ─── GET: Pending prescriptions + Today's dispensings ─────────────────────────
export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as any).role;
    if (role !== "PHARMACIST" && role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ------------------------------------------------------------------
    // 1. Pending prescriptions — MedicalRecords that have Prescription
    //    items where none or only some have been dispensed.
    //    We flag each Prescription with its dispensed qty so the UI can
    //    show remaining amounts.
    // ------------------------------------------------------------------
    const medicalRecords = await prisma.medicalRecord.findMany({
      where: {
        prescriptions: { some: {} }, // has at least one prescription item
      },
      orderBy: { date: "desc" },
      take: 50,
      include: {
        patient: { include: { user: { select: { name: true } } } },
        doctor: { include: { user: { select: { name: true } } } },
        prescriptions: true,
      },
    });

    // For each prescription item, figure out how much has already been
    // dispensed so we can show remaining.
    const allPrescriptionIds = medicalRecords.flatMap((r: any) =>
      r.prescriptions.map((p: any) => p.id)
    );

    const dispensedAgg = await prisma.drugDispensing.groupBy({
      by: ["prescriptionId"],
      where: { prescriptionId: { in: allPrescriptionIds } },
      _sum: { quantity: true },
    });

    const dispensedMap: Record<string, number> = {};
    dispensedAgg.forEach((d: any) => {
      if (d.prescriptionId) {
        dispensedMap[d.prescriptionId] = d._sum.quantity ?? 0;
      }
    });

    // Also fetch drug catalogue for name→Drug matching
    const drugs = await prisma.drug.findMany({
      where: { isActive: true },
      include: { stocks: true },
    });
    const drugStockMap: Record<string, { drug: any; totalStock: number }> = {};
    drugs.forEach((d: any) => {
      const total = d.stocks.reduce((s: number, st: any) => s + st.quantity, 0);
      drugStockMap[d.id] = { drug: d, totalStock: total };
      // also index by lowercase name for fuzzy matching
    });

    const pending = medicalRecords
      .map((record: any) => {
        const items = record.prescriptions.map((p: any) => {
          const dispensed = dispensedMap[p.id] ?? 0;
          const remaining = Math.max(0, (p.quantity ?? 0) - dispensed);

          // Try to match prescription drug name to catalogue
          const matchedDrug = drugs.find(
            (d: any) =>
              d.name.toLowerCase().includes(p.drugName.toLowerCase()) ||
              p.drugName.toLowerCase().includes(d.name.toLowerCase()) ||
              (d.genericName &&
                d.genericName.toLowerCase().includes(p.drugName.toLowerCase()))
          );

          return {
            ...p,
            dispensedQty: dispensed,
            remainingQty: remaining,
            fullyDispensed: remaining === 0,
            matchedDrugId: matchedDrug?.id ?? null,
            matchedDrugName: matchedDrug?.name ?? null,
            availableStock: matchedDrug
              ? drugStockMap[matchedDrug.id]?.totalStock ?? 0
              : 0,
          };
        });

        const allDispensed = items.every((i: any) => i.fullyDispensed);
        return {
          recordId: record.id,
          date: record.date,
          patientId: record.patientId,
          patientName: record.patient.user.name,
          doctorName: record.doctor.user.name,
          allDispensed,
          items,
        };
      })
      .filter((r: any) => !r.allDispensed); // only show pending

    // ------------------------------------------------------------------
    // 2. Dispensed Today
    // ------------------------------------------------------------------
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    const dispensedToday = await prisma.drugDispensing.findMany({
      where: { dispensedAt: { gte: todayStart, lte: todayEnd } },
      orderBy: { dispensedAt: "desc" },
      include: {
        drug: { select: { name: true, unit: true } },
      },
    });

    // Enrich with dispenser name and patient name
    const dispensedTodayEnriched = await Promise.all(
      dispensedToday.map(async (d: any) => {
        const dispenser = await prisma.user.findUnique({
          where: { id: d.dispensedById },
          select: { name: true },
        });
        const patient = await prisma.patient.findUnique({
          where: { id: d.patientId },
          include: { user: { select: { name: true } } },
        });
        return {
          ...d,
          dispenserName: dispenser?.name ?? "Unknown",
          patientName: patient?.user?.name ?? "Unknown",
        };
      })
    );

    return NextResponse.json({ pending, dispensedToday: dispensedTodayEnriched });
  } catch (error) {
    console.error("GET Dispense Error:", error);
    return NextResponse.json({ error: "Failed to fetch dispense data" }, { status: 500 });
  }
}

// ─── POST: Dispense a drug ─────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as any).role;
    if (role !== "PHARMACIST" && role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { drugId, prescriptionId, patientId, quantity, notes } = body;

    if (!drugId || !patientId || !quantity || quantity <= 0) {
      return NextResponse.json(
        { error: "drugId, patientId, and a positive quantity are required" },
        { status: 400 }
      );
    }

    // 1. Fetch drug + its stocks (FIFO = oldest first)
    const drug = await prisma.drug.findUnique({
      where: { id: drugId },
      include: {
        stocks: {
          where: { quantity: { gt: 0 } },
          orderBy: { receivedAt: "asc" }, // oldest batch first = FIFO
        },
      },
    });

    if (!drug) return NextResponse.json({ error: "Drug not found" }, { status: 404 });

    const totalStock = drug.stocks.reduce((sum: number, s: any) => sum + s.quantity, 0);

    // 2. Check sufficient stock
    if (quantity > totalStock) {
      return NextResponse.json(
        { error: `Insufficient stock. Available: ${totalStock}, Requested: ${quantity}` },
        { status: 400 }
      );
    }

    // 3. Deduct FIFO — reduce from oldest batches first
    let remaining = Number(quantity);
    for (const stock of drug.stocks) {
      if (remaining <= 0) break;
      const deduct = Math.min(stock.quantity, remaining);
      await prisma.drugStock.update({
        where: { id: stock.id },
        data: { quantity: { decrement: deduct } },
      });
      remaining -= deduct;
    }

    // 4. Create DrugDispensing record
    const dispensing = await prisma.drugDispensing.create({
      data: {
        drugId,
        prescriptionId: prescriptionId ?? null,
        patientId,
        quantity: Number(quantity),
        dispensedById: session.user.id,
        notes: notes ?? null,
      },
    });

    // 5. If there's an invoice for the patient's appointment, add InvoiceItem
    if (prescriptionId) {
      try {
        const prescription = await prisma.prescription.findUnique({
          where: { id: prescriptionId },
          include: { medicalRecord: true },
        });

        if (prescription?.medicalRecord?.appointmentId) {
          const invoice = await prisma.invoice.findUnique({
            where: { appointmentId: prescription.medicalRecord.appointmentId },
          });

          if (invoice) {
            const unitPrice = 0; // Pharmacy may not have a fixed price; extend later
            await prisma.invoiceItem.create({
              data: {
                invoiceId: invoice.id,
                description: `${drug.name} (Pharmacy) x${quantity}`,
                quantity: Number(quantity),
                unitPrice: unitPrice,
                totalPrice: unitPrice * Number(quantity),
              },
            });

            // Recalculate invoice total
            const allItems = await prisma.invoiceItem.findMany({
              where: { invoiceId: invoice.id },
            });
            const newTotal = allItems.reduce(
              (s: number, i: any) => s + Number(i.totalPrice),
              0
            );
            await prisma.invoice.update({
              where: { id: invoice.id },
              data: { totalAmount: newTotal },
            });
          }
        }
      } catch (invoiceErr) {
        // Non-fatal — dispensing already recorded
        console.warn("Invoice update skipped:", invoiceErr);
      }
    }

    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "127.0.0.1";
    await createAuditLog({
      userId: session.user.id,
      userRole: role,
      action: "CREATE",
      entity: "DrugDispensing",
      entityId: dispensing.id,
      newValues: { drugId, prescriptionId, patientId, quantity, notes },
      ipAddress,
    });

    return NextResponse.json({ success: true, dispensingId: dispensing.id });
  } catch (error) {
    console.error("POST Dispense Error:", error);
    return NextResponse.json({ error: "Failed to dispense drug" }, { status: 500 });
  }
}
