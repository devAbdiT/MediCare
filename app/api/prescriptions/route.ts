// app/api/prescriptions/route.ts
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

// GET /api/prescriptions?recordId=X - Retrieve all prescription items for a medical record
export async function GET(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const recordId = searchParams.get("recordId");

  if (!recordId) {
    return NextResponse.json({ error: "Missing recordId" }, { status: 400 });
  }

  try {
    const items = await prisma.prescription.findMany({
      where: { medicalRecordId: recordId }
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error("Fetch Prescriptions Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// POST /api/prescriptions - Create/overwrite prescription items for a medical record
export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const role = (session.user as any).role;
  if (role !== "DOCTOR" && role !== "ADMIN") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const body = await req.json();
    const { medicalRecordId, items } = body;

    if (!medicalRecordId || !Array.isArray(items)) {
      return NextResponse.json({ error: "Missing medicalRecordId or items array" }, { status: 400 });
    }

    // Wrap in transaction: delete all existing prescriptions, then create the new list
    const result = await prisma.$transaction(async (tx) => {
      // 1. Delete existing
      await tx.prescription.deleteMany({
        where: { medicalRecordId }
      });

      // 2. Create new ones
      const createdItems = [];
      for (const item of items) {
        if (!item.drugName || !item.dose || !item.frequency || !item.duration) {
          throw new Error("INVALID_ITEM_FIELDS");
        }

        const qty = item.quantity !== undefined && item.quantity !== "" ? parseInt(item.quantity, 10) : null;

        const created = await tx.prescription.create({
          data: {
            medicalRecordId,
            drugName: item.drugName,
            dose: item.dose,
            frequency: item.frequency,
            duration: item.duration,
            route: item.route || "Oral",
            quantity: qty,
            instructions: item.instructions || null
          }
        });
        createdItems.push(created);
      }

      return createdItems;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Save Prescriptions Error:", error);
    if (error.message === "INVALID_ITEM_FIELDS") {
      return NextResponse.json({ error: "Drug Name, Dose, Frequency, and Duration are required fields" }, { status: 400 });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
