import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = session.user as any;
    const role = user.role as string;
    
    let whereClause = {};

    if (role === "DOCTOR") {
      const doctor = await prisma.doctor.findUnique({ where: { userId: user.id } });
      if (!doctor) return NextResponse.json({ error: "Doctor profile not found" }, { status: 404 });
      
      whereClause = {
        OR: [
          { fromDoctorId: doctor.id },
          { toDoctorId: doctor.id },
          { toDepartmentId: doctor.departmentId }
        ]
      };
    } else if (role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const referrals = await prisma.referral.findMany({
      where: whereClause,
      include: {
        patient: { include: { user: true } },
        fromDoctor: { include: { user: true, department: true } },
        toDoctor: { include: { user: true, department: true } },
        toDepartment: true,
        appointment: true
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(referrals);
  } catch (error) {
    console.error("GET Referrals Error:", error);
    return NextResponse.json({ error: "Failed to fetch referrals" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = session.user as any;
    const role = user.role as string;
    if (role !== "DOCTOR") return NextResponse.json({ error: "Only DOCTOR can create referrals" }, { status: 403 });

    const fromDoctor = await prisma.doctor.findUnique({ where: { userId: user.id } });
    if (!fromDoctor) return NextResponse.json({ error: "Doctor profile not found" }, { status: 404 });

    const body = await req.json();
    const { appointmentId, patientId, toDoctorId, toDepartmentId, reason, urgency, notes } = body;

    if (!appointmentId || !patientId || !reason) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!toDoctorId && !toDepartmentId) {
      return NextResponse.json({ error: "Either toDoctorId or toDepartmentId is required" }, { status: 400 });
    }

    const referral = await prisma.referral.create({
      data: {
        appointmentId,
        patientId,
        fromDoctorId: fromDoctor.id,
        toDoctorId: toDoctorId || null,
        toDepartmentId: toDepartmentId || null,
        reason,
        urgency: urgency || "ROUTINE",
        notes: notes || null,
        status: "PENDING"
      }
    });

    return NextResponse.json(referral, { status: 201 });
  } catch (error) {
    console.error("POST Referral Error:", error);
    return NextResponse.json({ error: "Failed to create referral" }, { status: 500 });
  }
}
