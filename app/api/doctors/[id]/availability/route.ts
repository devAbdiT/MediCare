import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { startOfDay, endOfDay } from "date-fns";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: doctorId } = await params;
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const dateParam = searchParams.get("date");

  if (!dateParam) {
    return new NextResponse("Date is required", { status: 400 });
  }

  const date = new Date(dateParam);
  const start = startOfDay(date);
  const end = endOfDay(date);

  // Get all appointments for this doctor on this day
  const appointments = await prisma.appointment.findMany({
    where: {
      doctorId,
      dateTime: { gte: start, lte: end },
      status: { not: "CANCELLED" }
    },
    select: { dateTime: true }
  });

  const bookedHours = appointments.map(app => new Date(app.dateTime).getHours());

  // Available slots from 9 AM to 5 PM
  const workingHours = Array.from({ length: 9 }, (_, i) => i + 9);
  const availableSlots = workingHours.filter(hour => !bookedHours.includes(hour));

  return NextResponse.json({ availableSlots });
}
