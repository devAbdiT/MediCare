import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "";
  const statusParam = searchParams.get("status");

  const { role, id: userId } = session.user as any;

  let dbQuery: any = {
    where: {
      OR: [
        { patient: { user: { name: { contains: query, mode: "insensitive" } } } },
        { doctor: { user: { name: { contains: query, mode: "insensitive" } } } },
      ]
    },
    include: {
      patient: { include: { user: { select: { name: true, phone: true } } } },
      doctor: { include: { user: { select: { name: true } } } },
    },
    orderBy: { dateTime: "asc" }
  };

  if (statusParam) {
    dbQuery.where.status = statusParam;
  }

  // Filter based on role
  if (role === "DOCTOR") {
    const doctor = await prisma.doctor.findUnique({ where: { userId } });
    dbQuery.where.doctorId = doctor?.id;
  } else if (role === "PATIENT") {
    const patient = await prisma.patient.findUnique({ where: { userId } });
    dbQuery.where.patientId = patient?.id;
  }
  // ADMIN and RECEPTIONIST see everything within the search parameters

  const appointments = await prisma.appointment.findMany(dbQuery);
  return NextResponse.json(appointments);
}
