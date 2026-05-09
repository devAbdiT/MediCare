// app/api/appointments/check-availability/route.ts
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { startOfHour, endOfHour } from "date-fns";

// GET /api/appointments/check-availability?doctorId=...&dateTime=...
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const doctorId = searchParams.get("doctorId");
  const dateTimeStr = searchParams.get("dateTime");

  if (!doctorId || !dateTimeStr) {
    return new NextResponse("Missing parameters", { status: 400 });
  }

  const requestedTime = new Date(dateTimeStr);
  
  // We assume an appointment takes 1 hour for simplicity
  const startTime = startOfHour(requestedTime);
  const endTime = endOfHour(requestedTime);

  const existingAppointment = await prisma.appointment.findFirst({
    where: {
      doctorId,
      dateTime: {
        gte: startTime,
        lte: endTime,
      },
      status: {
        not: "CANCELLED"
      }
    }
  });

  return NextResponse.json({ 
    available: !existingAppointment 
  });
}
