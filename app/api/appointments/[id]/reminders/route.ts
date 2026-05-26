import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(
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

  const userRole = (session.user as any).role;

  // Only RECEPTIONIST and ADMIN can mark reminder as sent
  if (userRole !== "ADMIN" && userRole !== "RECEPTIONIST") {
    return new NextResponse("Only admin or receptionist can manage reminders", { status: 403 });
  }

  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      return new NextResponse("Appointment not found", { status: 404 });
    }

    if (appointment.status === "NO_SHOW") {
      return new NextResponse("No-show appointments do not need reminders.", { status: 400 });
    }

    if (appointment.status === "CANCELLED" || appointment.status === "COMPLETED") {
      return new NextResponse(`Cannot set reminder for a ${appointment.status.toLowerCase()} appointment.`, { status: 400 });
    }

    // Check if a SENT reminder already exists
    const existingReminder = await prisma.appointmentReminder.findFirst({
      where: {
        appointmentId: id,
        status: "SENT",
      },
      orderBy: { sentAt: "desc" }
    });

    if (existingReminder) {
      return new NextResponse("Reminder was already marked as sent.", { status: 400 });
    }

    let message = "Patient was manually reminded about this appointment.";
    try {
      const body = await req.json();
      if (body.message) message = body.message;
    } catch(e) {
      // Body might be empty
    }

    const reminder = await prisma.appointmentReminder.create({
      data: {
        appointmentId: id,
        reminderType: "MANUAL",
        status: "SENT",
        message: message,
        sentAt: new Date(),
      }
    });

    return NextResponse.json(reminder);
  } catch (error) {
    console.error("Reminder Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
