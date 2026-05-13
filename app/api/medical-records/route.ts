// app/api/medical-records/route.ts
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

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

      return record;
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("Medical Record Creation Error:", err);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
