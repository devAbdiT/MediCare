// app/api/doctors/[id]/slots/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getDoctorAvailability } from "@/lib/availability";
import { format, parseISO, startOfDay, addDays } from "date-fns";

// Helper to generate hourly slot strings based on start and end times (HH:mm)
function generateHourlySlots(start: string, end: string): string[] {
  const startHour = parseInt(start.split(":")[0], 10);
  const endHour = parseInt(end.split(":")[0], 10);
  const slots: string[] = [];
  for (let h = startHour; h < endHour; h++) {
    const hour = h.toString().padStart(2, "0");
    slots.push(`${hour}:00`);
  }
  return slots;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id: doctorId } = await params;
  const url = new URL(req.url);
  const dateParam = url.searchParams.get("date");
  if (!dateParam) {
    return new NextResponse("Missing date query parameter", { status: 400 });
  }
  const date = parseISO(dateParam);
  if (isNaN(date.getTime())) {
    return new NextResponse("Invalid date format", { status: 400 });
  }

  // Role based access
  const role = session.user?.role;
  const userId = session.user?.id;

  if (role === "DOCTOR") {
    // Verify the doctor belongs to the logged‑in user
    const doctor = await prisma.doctor.findUnique({ where: { id: doctorId }, select: { userId: true } });
    if (!doctor || doctor.userId !== userId) {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }
  // RECEPTIONIST, ADMIN, PATIENT are allowed to view any doctor's slots

  // Get doctor availability for the requested day
  const availabilities = await getDoctorAvailability(doctorId);
  const dayOfWeek = date.getDay(); // 0 = Sunday
  const dayAvail = availabilities.find(a => a.dayOfWeek === dayOfWeek && a.isActive);
  if (!dayAvail) {
    return NextResponse.json({ slots: [] });
  }

  const slotTimes = generateHourlySlots(dayAvail.startTime, dayAvail.endTime);

  // Fetch existing appointments for that doctor on the given date
  const dayStart = startOfDay(date);
  const dayEnd = addDays(dayStart, 1);
  const appointments = await prisma.appointment.findMany({
    where: {
      doctorId,
      dateTime: {
        gte: dayStart,
        lt: dayEnd,
      },
      status: {
        in: ["SCHEDULED", "RESCHEDULED", "CHECKED_IN", "COMPLETED", "NO_SHOW"],
      },
    },
    select: { dateTime: true },
  });

  const bookedTimes = new Set(
    appointments.map(a => format(a.dateTime, "HH:mm"))
  );

  const slots = slotTimes.map(time => {
    const isBooked = bookedTimes.has(time);
    return {
      time,
      label: format(parseISO(`${dateParam}T${time}`), "h:mm a"),
      available: !isBooked,
      ...(isBooked ? { reason: "Booked" } : {}),
    };
  });

  return NextResponse.json({ slots });
}
