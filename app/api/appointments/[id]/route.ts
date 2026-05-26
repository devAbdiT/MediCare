// app/api/appointments/[id]/route.ts
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { status, dateTime, appointmentType, priority } = await req.json();

  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { patient: true }
    });

    if (!appointment) {
      return new NextResponse("Appointment not found", { status: 404 });
    }

    // Authorization check
    // Patients can only cancel their own appointments
    if ((session.user as any).role === "PATIENT") {
      if (appointment.patient.userId !== session.user.id) {
        return new NextResponse("Forbidden", { status: 403 });
      }
      // Patients can only cancel, not reschedule (as per FR-10)
      if (status !== "CANCELLED") {
        return new NextResponse("Patients can only cancel appointments", { status: 403 });
      }
    }

    // Admins and Receptionists can do anything
    const validTypes = ["NEW_VISIT", "FOLLOW_UP", "CONSULTATION", "EMERGENCY"];
    const validPriorities = ["NORMAL", "URGENT", "EMERGENCY"];

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        status: status || undefined,
        dateTime: dateTime ? new Date(dateTime) : undefined,
        appointmentType: validTypes.includes(appointmentType) ? (appointmentType as any) : undefined,
        priority: validPriorities.includes(priority) ? (priority as any) : undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Appointment Update Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session || ((session.user as any).role !== "ADMIN" && (session.user as any).role !== "RECEPTIONIST")) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    await prisma.appointment.delete({
      where: { id },
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
