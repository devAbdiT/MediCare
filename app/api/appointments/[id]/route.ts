// app/api/appointments/[id]/route.ts
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { startOfDay, endOfDay } from "date-fns";
import { validateDoctorAvailability } from "@/lib/availability";

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

  const { status, dateTime, appointmentType, priority, reason } = await req.json();
  const userRole = (session.user as any).role;

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
    if (userRole === "PATIENT") {
      if (appointment.patient.userId !== session.user.id) {
        return new NextResponse("Forbidden", { status: 403 });
      }
      // Patients can only cancel, not change other statuses
      if (status !== "CANCELLED") {
        return new NextResponse("Patients can only cancel appointments", { status: 403 });
      }
    }

    // ── CHECK-IN logic ──────────────────────────────────────────────
    if (status === "CHECKED_IN") {
      // Only ADMIN or RECEPTIONIST can check in
      if (userRole !== "ADMIN" && userRole !== "RECEPTIONIST") {
        return new NextResponse("Only admin or receptionist can check in patients", { status: 403 });
      }
      // Can only check in from SCHEDULED
      if (appointment.status !== "SCHEDULED") {
        return new NextResponse(
          `Cannot check in an appointment with status "${appointment.status}". Only SCHEDULED appointments can be checked in.`,
          { status: 400 }
        );
      }

      // Auto-increment daily queue number per doctor
      const today = new Date();
      const dayStart = startOfDay(today);
      const dayEnd = endOfDay(today);

      const lastQueued = await prisma.appointment.findFirst({
        where: {
          doctorId: appointment.doctorId,
          status: "CHECKED_IN",
          checkedInAt: { gte: dayStart, lte: dayEnd },
          queueNumber: { not: null },
        },
        orderBy: { queueNumber: "desc" },
      });

      const nextQueue = (lastQueued?.queueNumber ?? 0) + 1;

      const updated = await prisma.appointment.update({
        where: { id },
        data: {
          status: "CHECKED_IN",
          checkedInAt: new Date(),
          queueNumber: nextQueue,
        },
      });

      return NextResponse.json(updated);
    }

    // ── NO-SHOW logic ───────────────────────────────────────────────
    if (status === "NO_SHOW") {
      // Only ADMIN or RECEPTIONIST can mark no-show
      if (userRole !== "ADMIN" && userRole !== "RECEPTIONIST") {
        return new NextResponse("Only admin or receptionist can mark no-show", { status: 403 });
      }
      // Can mark no-show from SCHEDULED or CHECKED_IN
      if (appointment.status !== "SCHEDULED" && appointment.status !== "CHECKED_IN") {
        return new NextResponse(
          `Cannot mark no-show for status "${appointment.status}". Only SCHEDULED or CHECKED_IN appointments can be marked as no-show.`,
          { status: 400 }
        );
      }

      const updated = await prisma.appointment.update({
        where: { id },
        data: { status: "NO_SHOW" },
      });

      return NextResponse.json(updated);
    }

    // ── RESCHEDULE logic ────────────────────────────────────────────
    let finalStatus = status;
    if (dateTime) {
      const newDate = new Date(dateTime);
      // Check if dateTime actually changed
      if (newDate.getTime() !== appointment.dateTime.getTime()) {
        // Validate against doctor working hours first
        const availabilityCheck = await validateDoctorAvailability(appointment.doctorId, newDate);
        if (!availabilityCheck.valid) {
          return new NextResponse(availabilityCheck.message, { status: 400 });
        }

        if (!reason || reason.trim().length < 3) {
          return new NextResponse("Please enter a valid reason for rescheduling this appointment.", { status: 400 });
        }
        if (appointment.status === "COMPLETED" || appointment.status === "CANCELLED") {
          return new NextResponse(`${appointment.status.charAt(0) + appointment.status.slice(1).toLowerCase()} appointments cannot be rescheduled.`, { status: 400 });
        }
        
        finalStatus = "RESCHEDULED";

        // Create history record
        await prisma.appointmentHistory.create({
          data: {
            appointmentId: appointment.id,
            oldDateTime: appointment.dateTime,
            newDateTime: newDate,
            oldStatus: appointment.status,
            newStatus: "RESCHEDULED",
            reason: reason,
            actionType: "RESCHEDULE",
            changedByUserId: session.user.id,
            changedByName: session.user.name,
            changedByRole: userRole,
          }
        });
      }
    }

    // ── General update logic (complete, cancel, reschedule, etc.) ──
    const validTypes = ["NEW_VISIT", "FOLLOW_UP", "CONSULTATION", "EMERGENCY"];
    const validPriorities = ["NORMAL", "URGENT", "EMERGENCY"];

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        status: finalStatus || undefined,
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
