import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session || (session.user as any).role !== "DOCTOR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { patientId, doctorId, dateTime, reason } = await request.json();

    if (!patientId || !doctorId || !dateTime) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Double check availability
    const existing = await prisma.appointment.findFirst({
      where: {
        doctorId,
        dateTime: new Date(dateTime),
        status: { in: ["SCHEDULED"] }
      }
    });

    if (existing) {
      return NextResponse.json(
        { error: "Time slot already booked" },
        { status: 400 }
      );
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        doctorId,
        dateTime: new Date(dateTime),
        reason: reason || "Follow-up",
        status: "SCHEDULED",
      },
    });

    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    console.error("Follow-up appointment creation error:", error);
    return NextResponse.json(
      { error: "Failed to schedule follow-up" },
      { status: 500 }
    );
  }
}
