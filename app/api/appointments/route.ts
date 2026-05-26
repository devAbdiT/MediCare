// app/api/appointments/route.ts
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { startOfHour, endOfHour } from "date-fns";

// GET /api/appointments - List appointments based on role
export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { role, id: userId } = session.user as any;

  let query: any = {
    include: {
      patient: { include: { user: { select: { name: true } } } },
      doctor: { include: { user: { select: { name: true } } } },
    },
    orderBy: { dateTime: "asc" }
  };

  // Filter based on role
  if (role === "DOCTOR") {
    const doctor = await prisma.doctor.findUnique({ where: { userId } });
    query.where = { doctorId: doctor?.id };
  } else if (role === "PATIENT") {
    const patient = await prisma.patient.findUnique({ where: { userId } });
    query.where = { patientId: patient?.id };
  }
  // ADMIN and RECEPTIONIST see everything

  const appointments = await prisma.appointment.findMany(query);
  return NextResponse.json(appointments);
}

// POST /api/appointments - Book a new appointment
export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    const { patientId, doctorId, dateTime, reason, appointmentType, priority } = body;

    const requestedTime = new Date(dateTime);
    const startTime = startOfHour(requestedTime);
    const endTime = endOfHour(requestedTime);

    // 1. Server-side availability check
    const existing = await prisma.appointment.findFirst({
      where: {
        doctorId,
        dateTime: { gte: startTime, lte: endTime },
        status: { not: "CANCELLED" }
      }
    });

    if (existing) {
      return new NextResponse("Doctor is already booked for this time slot", { status: 400 });
    }

    // 2. Resolve IDs
    let finalPatientId = patientId;
    if ((session.user as any).role === "PATIENT") {
      const patient = await prisma.patient.findUnique({ where: { userId: session.user.id } });
      finalPatientId = patient?.id;
    }

    const validTypes = ["NEW_VISIT", "FOLLOW_UP", "CONSULTATION", "EMERGENCY"];
    const validPriorities = ["NORMAL", "URGENT", "EMERGENCY"];

    const finalAppointmentType = validTypes.includes(appointmentType) ? appointmentType : "NEW_VISIT";
    const finalPriority = validPriorities.includes(priority) ? priority : "NORMAL";

    // 3. Create Appointment
    const appointment = await prisma.appointment.create({
      data: {
        patientId: finalPatientId,
        doctorId,
        dateTime: requestedTime,
        reason,
        appointmentType: finalAppointmentType,
        priority: finalPriority,
        receptionistId: (session.user as any).role === "RECEPTIONIST" ? 
          (await prisma.receptionist.findUnique({ where: { userId: session.user.id } }))?.id : 
          null,
      }
    });

    return NextResponse.json(appointment);
  } catch (error) {
    console.error("Booking Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
