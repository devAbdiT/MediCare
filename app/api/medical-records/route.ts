// app/api/medical-records/route.ts
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { createConsultationInvoice } from "@/lib/billing";
import { createAuditLog } from "@/lib/audit";

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session || (session.user as any).role !== "DOCTOR") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { appointmentId, patientId, doctorId, diagnosis, prescription, notes } = await req.json();

  try {
    // Start a transaction to ensure both record is created and appointment is updated
    const result = await prisma.$transaction(async (tx) => {
      const record = await tx.medicalRecord.create({
        data: {
          patientId,
          doctorId,
          diagnosis,
          prescription,
          notes,
        },
      });

      await tx.appointment.update({
        where: { id: appointmentId },
        data: { status: "COMPLETED" },
      });

      // Automatically create Consultation Invoice
      try {
        await createConsultationInvoice(tx, {
          patientId,
          appointmentId,
          doctorId,
          createdById: session.user.id,
        });
      } catch (invoiceErr: any) {
        // If it's a unique constraint error (P2002) for the appointmentId, skip and do not throw/rollback.
        if (invoiceErr?.code === "P2002") {
          console.warn(`[medical-records] Invoice already exists for appointment ${appointmentId}. Skipping...`);
        } else {
          throw invoiceErr;
        }
      }

      return record;
    });

    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "127.0.0.1";
    await createAuditLog({
      userId: session.user.id,
      userRole: (session.user as any).role,
      action: "CREATE",
      entity: "MedicalRecord",
      entityId: result.id,
      newValues: { patientId, doctorId, diagnosis, prescription, notes, appointmentId },
      ipAddress,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("Medical Record Creation Error:", err);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
