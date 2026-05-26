import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { startOfDay, endOfDay } from "date-fns";

export async function GET(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || searchParams.get("search") || "";
  const statusParam = searchParams.get("status");
  const dateParam = searchParams.get("date");
  const doctorIdParam = searchParams.get("doctorId");
  const departmentIdParam = searchParams.get("departmentId");
  const typeParam = searchParams.get("appointmentType");
  const priorityParam = searchParams.get("priority");

  const { role, id: userId } = session.user as any;

  let dbQuery: any = {
    where: {
      AND: []
    },
    include: {
      patient: { include: { user: { select: { name: true, phone: true, email: true } } } },
      doctor: { include: { user: { select: { name: true } }, department: true } },
      reminders: { orderBy: { sentAt: "desc" }, take: 1 }
    },
    orderBy: { dateTime: "asc" }
  };

  if (query) {
    dbQuery.where.AND.push({
      OR: [
        { patient: { user: { name: { contains: query, mode: "insensitive" } } } },
        { patient: { cardNumber: { contains: query, mode: "insensitive" } } },
        { patient: { user: { phone: { contains: query, mode: "insensitive" } } } },
        { doctor: { user: { name: { contains: query, mode: "insensitive" } } } },
      ]
    });
  }

  if (statusParam) {
    dbQuery.where.AND.push({ status: statusParam });
  }

  if (dateParam) {
    const targetDate = new Date(dateParam);
    if (!isNaN(targetDate.getTime())) {
      dbQuery.where.AND.push({
        dateTime: {
          gte: startOfDay(targetDate),
          lte: endOfDay(targetDate),
        }
      });
    }
  }

  if (doctorIdParam && doctorIdParam !== "all") {
    dbQuery.where.AND.push({ doctorId: doctorIdParam });
  }

  if (departmentIdParam && departmentIdParam !== "all") {
    dbQuery.where.AND.push({ doctor: { departmentId: departmentIdParam } });
  }

  if (typeParam && typeParam !== "all") {
    dbQuery.where.AND.push({ appointmentType: typeParam });
  }

  if (priorityParam && priorityParam !== "all") {
    dbQuery.where.AND.push({ priority: priorityParam });
  }

  // Filter based on role
  if (role === "DOCTOR") {
    const doctor = await prisma.doctor.findUnique({ where: { userId } });
    dbQuery.where.AND.push({ doctorId: doctor?.id });
  } else if (role === "PATIENT") {
    const patient = await prisma.patient.findUnique({ where: { userId } });
    dbQuery.where.AND.push({ patientId: patient?.id });
  }
  // ADMIN and RECEPTIONIST see everything within the search parameters

  // If AND is empty, remove it to avoid Prisma errors (though Prisma usually handles empty AND fine)
  if (dbQuery.where.AND.length === 0) {
    delete dbQuery.where.AND;
  }

  const appointments = await prisma.appointment.findMany(dbQuery);
  return NextResponse.json(appointments);
}
