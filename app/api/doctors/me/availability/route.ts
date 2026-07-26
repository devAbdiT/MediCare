// app/api/doctors/me/availability/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getDoctorAvailability, updateDoctorAvailability } from "@/lib/availability";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || (session.user as any).role !== "DOCTOR") {
      return NextResponse.json({ error: "Unauthorized - Doctor role required" }, { status: 401 });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!doctor) {
      return NextResponse.json({ error: "Doctor profile not found" }, { status: 404 });
    }

    const availabilities = await getDoctorAvailability(doctor.id);
    return NextResponse.json({ doctorId: doctor.id, availabilities });
  } catch (error) {
    console.error("GET Doctor Me Availability Error:", error);
    return NextResponse.json({ error: "Failed to fetch availability" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || (session.user as any).role !== "DOCTOR") {
      return NextResponse.json({ error: "Unauthorized - Doctor role required" }, { status: 401 });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!doctor) {
      return NextResponse.json({ error: "Doctor profile not found" }, { status: 404 });
    }

    const body = await req.json();
    const { schedule } = body;

    if (!Array.isArray(schedule)) {
      return NextResponse.json({ error: "Schedule must be an array" }, { status: 400 });
    }

    const updatedSchedule = await updateDoctorAvailability(doctor.id, schedule);
    return NextResponse.json({ doctorId: doctor.id, availabilities: updatedSchedule });
  } catch (error: any) {
    console.error("PUT Doctor Me Availability Error:", error);
    return NextResponse.json({ error: error.message || "Failed to update availability" }, { status: 500 });
  }
}
