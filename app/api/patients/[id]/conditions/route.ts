// app/api/patients/[id]/conditions/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET /api/patients/[id]/conditions - Get all chronic/medical conditions for a patient
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const patient = await prisma.patient.findUnique({
      where: { id },
    });

    if (!patient) {
      return new NextResponse("Patient not found", { status: 404 });
    }

    // Role check: Patient themselves or staff
    const userRole = (session.user as any).role;
    const isStaff = ["ADMIN", "RECEPTIONIST", "DOCTOR"].includes(userRole);
    if (!isStaff && patient.userId !== session.user.id) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const conditions = await prisma.medicalCondition.findMany({
      where: { patientId: id },
      orderBy: { diagnosedAt: "desc" },
    });

    return NextResponse.json(conditions);
  } catch (error) {
    console.error("GET Patient Conditions Error:", error);
    return NextResponse.json({ error: "Failed to fetch medical conditions" }, { status: 500 });
  }
}

// POST /api/patients/[id]/conditions - Create a new medical condition record (Staff only)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Role check: DOCTOR, RECEPTIONIST, ADMIN only
    const userRole = (session.user as any).role;
    const allowedRoles = ["ADMIN", "RECEPTIONIST", "DOCTOR"];
    if (!allowedRoles.includes(userRole)) {
      return new NextResponse("Forbidden - Staff access only", { status: 403 });
    }

    const patient = await prisma.patient.findUnique({
      where: { id },
    });

    if (!patient) {
      return new NextResponse("Patient not found", { status: 404 });
    }

    const body = await req.json();
    const { name, icdCode, diagnosedAt, isActive, notes } = body;

    if (!name) {
      return NextResponse.json({ error: "Medical condition name is required" }, { status: 400 });
    }

    const newCondition = await prisma.medicalCondition.create({
      data: {
        patientId: id,
        name: name.trim(),
        icdCode: icdCode ? icdCode.trim() : null,
        diagnosedAt: diagnosedAt ? new Date(diagnosedAt) : null,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        notes: notes ? notes.trim() : null,
      },
    });

    return NextResponse.json(newCondition, { status: 201 });
  } catch (error) {
    console.error("POST Patient Condition Error:", error);
    return NextResponse.json({ error: "Failed to create medical condition" }, { status: 500 });
  }
}
