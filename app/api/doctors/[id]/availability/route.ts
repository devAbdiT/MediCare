import { NextResponse } from "next/server";
import { getDoctorAvailability, updateDoctorAvailability } from "@/lib/availability";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const availabilities = await getDoctorAvailability(id);
    return NextResponse.json(availabilities);
  } catch (error) {
    console.error("Fetch Doctor Availability Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const doctor = await prisma.doctor.findUnique({ where: { id } });
    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    const userRole = (session.user as any).role;
    const isAdmin = userRole === "ADMIN";
    const isOwnDoctor = userRole === "DOCTOR" && doctor.userId === session.user.id;

    if (!isAdmin && !isOwnDoctor) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { schedule } = body;

    if (!Array.isArray(schedule)) {
      return NextResponse.json({ error: "Schedule must be an array" }, { status: 400 });
    }

    const updatedSchedule = await updateDoctorAvailability(id, schedule);
    return NextResponse.json(updatedSchedule);
  } catch (error: any) {
    console.error("Update Doctor Availability Error:", error);
    return NextResponse.json({ error: error.message || "Failed to update availability" }, { status: 500 });
  }
}

