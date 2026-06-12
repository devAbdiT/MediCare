// app/api/vitals/route.ts
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

// GET /api/vitals?appointmentId=X - Retrieve vital signs
export async function GET(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const appointmentId = searchParams.get("appointmentId");

  if (!appointmentId) {
    return NextResponse.json({ error: "Missing appointmentId" }, { status: 400 });
  }

  try {
    const vitals = await prisma.vitalSigns.findUnique({
      where: { appointmentId }
    });
    return NextResponse.json(vitals);
  } catch (error) {
    console.error("Fetch Vitals Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// POST /api/vitals - Upsert vital signs for an appointment
export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const role = (session.user as any).role;
  if (role !== "DOCTOR" && role !== "RECEPTIONIST" && role !== "ADMIN") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      appointmentId,
      patientId,
      bloodPressureSys,
      bloodPressureDia,
      temperature,
      weight,
      height,
      pulseRate,
      oxygenSaturation,
      respiratoryRate
    } = body;

    if (!appointmentId) {
      return NextResponse.json({ error: "Missing appointmentId" }, { status: 400 });
    }

    // Resolve patientId if not provided in the request body
    let resolvedPatientId = patientId;
    if (!resolvedPatientId) {
      const appt = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        select: { patientId: true }
      });
      if (!appt) {
        return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
      }
      resolvedPatientId = appt.patientId;
    }

    const sys = bloodPressureSys !== undefined && bloodPressureSys !== "" ? parseInt(bloodPressureSys, 10) : null;
    const dia = bloodPressureDia !== undefined && bloodPressureDia !== "" ? parseInt(bloodPressureDia, 10) : null;
    const temp = temperature !== undefined && temperature !== "" ? parseFloat(temperature) : null;
    const wt = weight !== undefined && weight !== "" ? parseFloat(weight) : null;
    const ht = height !== undefined && height !== "" ? parseFloat(height) : null;
    const pulse = pulseRate !== undefined && pulseRate !== "" ? parseInt(pulseRate, 10) : null;
    const o2 = oxygenSaturation !== undefined && oxygenSaturation !== "" ? parseFloat(oxygenSaturation) : null;
    const resp = respiratoryRate !== undefined && respiratoryRate !== "" ? parseInt(respiratoryRate, 10) : null;

    const vitals = await prisma.vitalSigns.upsert({
      where: { appointmentId },
      update: {
        bloodPressureSys: sys,
        bloodPressureDia: dia,
        temperature: temp,
        weight: wt,
        height: ht,
        pulseRate: pulse,
        oxygenSaturation: o2,
        respiratoryRate: resp,
        recordedById: session.user.id
      },
      create: {
        appointmentId,
        patientId: resolvedPatientId,
        bloodPressureSys: sys,
        bloodPressureDia: dia,
        temperature: temp,
        weight: wt,
        height: ht,
        pulseRate: pulse,
        oxygenSaturation: o2,
        respiratoryRate: resp,
        recordedById: session.user.id
      }
    });

    return NextResponse.json(vitals);
  } catch (error) {
    console.error("Upsert Vitals Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
