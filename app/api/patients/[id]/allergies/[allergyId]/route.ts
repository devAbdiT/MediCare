// app/api/patients/[id]/allergies/[allergyId]/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// DELETE /api/patients/[id]/allergies/[allergyId] - Delete an allergy (DOCTOR or ADMIN only)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; allergyId: string }> }
) {
  const { id, allergyId } = await params;
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Role check: DOCTOR or ADMIN only
    const userRole = (session.user as any).role;
    const allowedRoles = ["ADMIN", "DOCTOR"];
    if (!allowedRoles.includes(userRole)) {
      return new NextResponse("Forbidden - Doctors and Admins access only", { status: 403 });
    }

    const patient = await prisma.patient.findUnique({
      where: { id },
    });

    if (!patient) {
      return new NextResponse("Patient not found", { status: 404 });
    }

    const allergy = await prisma.allergy.findUnique({
      where: { id: allergyId },
    });

    if (!allergy || allergy.patientId !== id) {
      return new NextResponse("Allergy record not found or does not belong to this patient", { status: 404 });
    }

    await prisma.allergy.delete({
      where: { id: allergyId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE Patient Allergy Error:", error);
    return NextResponse.json({ error: "Failed to delete allergy" }, { status: 500 });
  }
}
