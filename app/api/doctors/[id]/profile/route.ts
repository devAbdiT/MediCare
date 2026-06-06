// app/api/doctors/[id]/profile/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET /api/doctors/[id]/profile — Return doctor with all profile fields
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

    const doctor = await prisma.doctor.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
        department: {
          select: { id: true, name: true, consultationFee: true },
        },
      },
    });

    if (!doctor) {
      return new NextResponse("Doctor not found", { status: 404 });
    }

    // Doctors can only view their own profile; staff can view any
    const userRole = (session.user as any).role;
    const isStaff = ["ADMIN", "RECEPTIONIST"].includes(userRole);
    if (!isStaff && doctor.userId !== session.user.id) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    return NextResponse.json(doctor);
  } catch (error) {
    console.error("GET Doctor Profile Error:", error);
    return NextResponse.json({ error: "Failed to fetch doctor profile" }, { status: 500 });
  }
}

// PATCH /api/doctors/[id]/profile — Update doctor profile
// DOCTOR: own profile (bio, profilePhoto, licenseNumber, qualifications)
// ADMIN: any doctor + consultationFee
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const doctor = await prisma.doctor.findUnique({ where: { id } });
    if (!doctor) {
      return new NextResponse("Doctor not found", { status: 404 });
    }

    const userRole = (session.user as any).role;
    const isAdmin = userRole === "ADMIN";
    const isOwnDoctor = userRole === "DOCTOR" && doctor.userId === session.user.id;

    if (!isAdmin && !isOwnDoctor) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const body = await req.json();
    const { bio, profilePhoto, consultationFee, specialization } = body;

    const doctorUpdateData: any = {};
    if (bio !== undefined) doctorUpdateData.bio = bio?.trim() || null;
    if (profilePhoto !== undefined) doctorUpdateData.profilePhoto = profilePhoto?.trim() || null;
    if (specialization !== undefined) doctorUpdateData.specialization = specialization?.trim();

    // Only ADMIN can set consultation fee
    if (isAdmin && consultationFee !== undefined) {
      const fee = parseFloat(consultationFee);
      if (isNaN(fee) || fee < 0) {
        return NextResponse.json({ error: "Invalid consultation fee" }, { status: 400 });
      }
      doctorUpdateData.consultationFee = fee;
    }

    // Update doctor record
    const updatedDoctor = await prisma.doctor.update({
      where: { id },
      data: doctorUpdateData,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        department: { select: { id: true, name: true, consultationFee: true } },
      },
    });

    return NextResponse.json(updatedDoctor);
  } catch (error) {
    console.error("PATCH Doctor Profile Error:", error);
    return NextResponse.json({ error: "Failed to update doctor profile" }, { status: 500 });
  }
}
