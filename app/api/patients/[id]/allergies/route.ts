// app/api/patients/[id]/allergies/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { AllergySeverity } from "@prisma/client";

// GET /api/patients/[id]/allergies - Get all allergies for a specific patient
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

    const allergies = await prisma.allergy.findMany({
      where: { patientId: id },
      orderBy: { confirmedAt: "desc" },
    });

    return NextResponse.json(allergies);
  } catch (error) {
    console.error("GET Patient Allergies Error:", error);
    return NextResponse.json({ error: "Failed to fetch allergies" }, { status: 500 });
  }
}

// POST /api/patients/[id]/allergies - Add a new allergy (Staff only: DOCTOR, RECEPTIONIST, ADMIN)
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

    // Roles restricted: DOCTOR, RECEPTIONIST, ADMIN
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
    const { allergen, severity, reaction, confirmedAt } = body;

    if (!allergen || !severity) {
      return NextResponse.json({ error: "Allergen and severity are required" }, { status: 400 });
    }

    const validSeverities = Object.values(AllergySeverity);
    if (!validSeverities.includes(severity)) {
      return NextResponse.json(
        { error: `Invalid severity. Must be one of: ${validSeverities.join(", ")}` },
        { status: 400 }
      );
    }

    const newAllergy = await prisma.allergy.create({
      data: {
        patientId: id,
        allergen: allergen.trim(),
        severity: severity as AllergySeverity,
        reaction: reaction ? reaction.trim() : null,
        confirmedAt: confirmedAt ? new Date(confirmedAt) : null,
      },
    });

    return NextResponse.json(newAllergy, { status: 201 });
  } catch (error) {
    console.error("POST Patient Allergy Error:", error);
    return NextResponse.json({ error: "Failed to add allergy" }, { status: 500 });
  }
}
