// app/api/appointments/route.ts
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { startOfHour, endOfHour } from "date-fns";
import { validateDoctorAvailability } from "@/lib/availability";
import { createAuditLog } from "@/lib/audit";

// GET /api/appointments - List appointments based on role
export async function GET(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { role, id: userId } = session.user as any;

  let query: any = {
    where: {},
    include: {
      patient: { include: { user: { select: { name: true, phone: true, email: true } } } },
      doctor: { include: { user: { select: { name: true } }, department: true } },
      reminders: { orderBy: { sentAt: "desc" }, take: 1 },
      payments: { orderBy: { createdAt: "desc" }, take: 1 }
    },
    orderBy: { dateTime: "asc" }
  };

  const andConditions: any[] = [];

  // Filter based on role
  if (role === "DOCTOR") {
    const doctor = await prisma.doctor.findUnique({ where: { userId } });
    andConditions.push({ doctorId: doctor?.id });
  } else if (role === "PATIENT") {
    const patient = await prisma.patient.findUnique({ where: { userId } });
    andConditions.push({ patientId: patient?.id });
  }

  const { searchParams } = new URL(req.url);
  const startDateStr = searchParams.get("startDate");
  const endDateStr = searchParams.get("endDate");

  if (startDateStr || endDateStr) {
    let dateFilter: any = {};
    if (startDateStr) {
      const start = new Date(startDateStr);
      if (!isNaN(start.getTime())) {
        const startRange = new Date(start);
        startRange.setHours(0, 0, 0, 0);
        dateFilter.gte = startRange;
      }
    }
    if (endDateStr) {
      const end = new Date(endDateStr);
      if (!isNaN(end.getTime())) {
        const endRange = new Date(end);
        endRange.setDate(endRange.getDate() + 1);
        endRange.setHours(0, 0, 0, 0);
        dateFilter.lt = endRange;
      }
    }
    if (Object.keys(dateFilter).length > 0) {
      andConditions.push({ dateTime: dateFilter });
    }
  }

  if (andConditions.length > 0) {
    query.where.AND = andConditions;
  } else {
    delete query.where;
  }

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
    const { patientId, doctorId, dateTime, reason, appointmentType, priority, walkIn, chiefComplaint, status } = body;

    const requestedTime = new Date(dateTime);
    const startTime = startOfHour(requestedTime);
    const endTime = endOfHour(requestedTime);

    // 1. Doctor Working Hours validation (skip for walk-ins with EMERGENCY priority)
    if (!walkIn || priority !== "EMERGENCY") {
      const availabilityCheck = await validateDoctorAvailability(doctorId, requestedTime);
      if (!availabilityCheck.valid) {
        return new NextResponse(availabilityCheck.message, { status: 400 });
      }
    }

    // 2. Server-side conflict check
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

    // 3. Resolve IDs
    let finalPatientId = patientId;
    if ((session.user as any).role === "PATIENT") {
      const patient = await prisma.patient.findUnique({ where: { userId: session.user.id } });
      finalPatientId = patient?.id;
    }

    const validTypes = ["NEW_VISIT", "FOLLOW_UP", "CONSULTATION", "EMERGENCY"];
    const validPriorities = ["NORMAL", "URGENT", "EMERGENCY"];
    const validStatuses = ["SCHEDULED", "CHECKED_IN", "RESCHEDULED"];

    const finalAppointmentType = validTypes.includes(appointmentType) ? appointmentType : "NEW_VISIT";
    const finalPriority = validPriorities.includes(priority) ? priority : "NORMAL";
    const finalStatus = validStatuses.includes(status) ? status : "SCHEDULED";

    // 4. Auto-assign queue number for walk-ins that are checked in
    let queueNumber: number | undefined;
    if (walkIn && finalStatus === "CHECKED_IN") {
      const todayStart = new Date(requestedTime);
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(todayStart);
      todayEnd.setDate(todayEnd.getDate() + 1);

      const checkedInToday = await prisma.appointment.count({
        where: {
          dateTime: { gte: todayStart, lt: todayEnd },
          status: "CHECKED_IN"
        }
      });
      queueNumber = checkedInToday + 1;
    }

    // 5. Create Appointment
    const appointment = await prisma.appointment.create({
      data: {
        patientId: finalPatientId,
        doctorId,
        dateTime: requestedTime,
        reason,
        appointmentType: finalAppointmentType,
        priority: finalPriority,
        status: finalStatus,
        walkIn: walkIn === true,
        chiefComplaint: chiefComplaint || null,
        checkedInAt: finalStatus === "CHECKED_IN" ? new Date() : null,
        queueNumber: queueNumber ?? null,
        receptionistId: (session.user as any).role === "RECEPTIONIST" ?
          (await prisma.receptionist.findUnique({ where: { userId: session.user.id } }))?.id :
          null,
      }
    });

    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "127.0.0.1";
    await createAuditLog({
      userId: session.user.id,
      userRole: (session.user as any).role,
      action: "CREATE",
      entity: "Appointment",
      entityId: appointment.id,
      newValues: { patientId: finalPatientId, doctorId, dateTime: requestedTime, reason, appointmentType: finalAppointmentType, priority: finalPriority, status: finalStatus, walkIn },
      ipAddress,
    });

    return NextResponse.json(appointment);
  } catch (error) {
    console.error("Booking Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
