// app/api/medical-records/[patientId]/route.ts
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ patientId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || (session.user as any).role !== "DOCTOR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { patientId } = await params;

    // Get the doctor record for this user
    const doctor = await prisma.doctor.findUnique({
      where: { userId: session.user.id },
    });

    if (!doctor) {
      return NextResponse.json({ error: "Doctor profile not found" }, { status: 404 });
    }

    // ACCESS CONTROL: Check if this doctor has treated this patient
    const hasAccess = await prisma.appointment.findFirst({
      where: {
        patientId,
        doctorId: doctor.id,
        status: { in: ["COMPLETED", "SCHEDULED", "RESCHEDULED"] },
      },
    });

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Access denied. You can only view records for patients you have treated." },
        { status: 403 }
      );
    }

    // Fetch medical records for this patient (only records this doctor created)
    const records = await prisma.medicalRecord.findMany({
      where: {
        patientId,
        doctorId: doctor.id,
      },
      include: {
        doctor: {
          include: {
            user: { select: { name: true } },
          },
        },
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(records);
  } catch (error) {
    console.error("Medical Records Fetch Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ patientId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || (session.user as any).role !== "DOCTOR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { patientId } = await params;

    const doctor = await prisma.doctor.findUnique({
      where: { userId: session.user.id },
    });

    if (!doctor) {
      return NextResponse.json({ error: "Doctor profile not found" }, { status: 404 });
    }

    const { recordId, diagnosis, prescription, notes } = await req.json();

    if (!recordId) {
      return NextResponse.json({ error: "Record ID is required" }, { status: 400 });
    }

    // Fetch the record and verify OWNERSHIP — doctor can only edit their own records
    const existingRecord = await prisma.medicalRecord.findUnique({
      where: { id: recordId },
    });

    if (!existingRecord) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    if (existingRecord.doctorId !== doctor.id) {
      return NextResponse.json(
        { error: "Access denied. You can only edit records you created." },
        { status: 403 }
      );
    }

    if (existingRecord.patientId !== patientId) {
      return NextResponse.json(
        { error: "Record does not belong to this patient." },
        { status: 400 }
      );
    }

    // Update the record — updatedAt is handled automatically by Prisma @updatedAt
    const updated = await prisma.medicalRecord.update({
      where: { id: recordId },
      data: {
        ...(diagnosis !== undefined && { diagnosis }),
        ...(prescription !== undefined && { prescription }),
        ...(notes !== undefined && { notes }),
      },
      include: {
        doctor: {
          include: {
            user: { select: { name: true } },
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Medical Record Update Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
