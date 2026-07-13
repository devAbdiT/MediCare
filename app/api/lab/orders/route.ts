// app/api/lab/orders/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * GET /api/lab/orders
 *
 * DOCTOR  → only their own orders
 * LABTECH / ADMIN → all orders
 * PATIENT → only their own orders
 *
 * Query params:
 *   ?status=ORDERED            filter by status
 *   ?appointmentId=<id>        filter by appointment
 *   ?urgency=STAT              filter by urgency
 *   ?queue=true                shorthand: non-completed, non-cancelled orders
 */
export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any).role as string;
    if (!["DOCTOR", "LABTECH", "ADMIN", "PATIENT"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const statusFilter      = searchParams.get("status");
    const appointmentId     = searchParams.get("appointmentId");
    const urgencyFilter     = searchParams.get("urgency");
    const queueOnly         = searchParams.get("queue") === "true";

    // For DOCTOR — restrict to their own orders only
    let doctorId: string | undefined;
    if (role === "DOCTOR") {
      const doctor = await prisma.doctor.findUnique({
        where: { userId: (session.user as any).id },
        select: { id: true },
      });
      if (!doctor) {
        return NextResponse.json({ error: "Doctor profile not found" }, { status: 404 });
      }
      doctorId = doctor.id;
    }

    let patientIdFilter: string | undefined;
    if (role === "PATIENT") {
      const patient = await prisma.patient.findUnique({
        where: { userId: (session.user as any).id },
        select: { id: true },
      });
      if (!patient) {
        return NextResponse.json({ error: "Patient profile not found" }, { status: 404 });
      }
      patientIdFilter = patient.id;
    } else if (searchParams.get("patientId")) {
      patientIdFilter = searchParams.get("patientId")!;
    }

    const orders = await prisma.labOrder.findMany({
      where: {
        ...(doctorId ? { doctorId } : {}),
        ...(patientIdFilter ? { patientId: patientIdFilter } : {}),
        ...(appointmentId ? { appointmentId } : {}),
        ...(statusFilter ? { status: statusFilter as any } : {}),
        ...(urgencyFilter ? { urgency: urgencyFilter as any } : {}),
        ...(queueOnly
          ? { status: { in: ["ORDERED", "SAMPLE_COLLECTED", "PROCESSING"] } }
          : {}),
      },
      include: {
        patient: {
          select: {
            cardNumber: true,
            user: { select: { name: true } },
          },
        },
        doctor: {
          select: { user: { select: { name: true } } },
        },
        testCatalogue: {
          select: { name: true, code: true, category: true, turnaroundHrs: true },
        },
        result: true,
      },
      orderBy: { orderedAt: "asc" },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("GET Lab Orders Error:", error);
    return NextResponse.json({ error: "Failed to fetch lab orders" }, { status: 500 });
  }
}

/**
 * POST /api/lab/orders
 * Only DOCTOR can create orders.
 *
 * Body: { appointmentId, patientId, testCatalogueId?, testName, urgency, sampleType?, notes? }
 */
export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || (session.user as any).role !== "DOCTOR") {
      return NextResponse.json({ error: "Only doctors can order lab tests" }, { status: 403 });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { userId: (session.user as any).id },
      select: { id: true },
    });
    if (!doctor) {
      return NextResponse.json({ error: "Doctor profile not found" }, { status: 404 });
    }

    const body = await req.json();
    const { appointmentId, patientId, testCatalogueId, testName, urgency, sampleType, notes } = body;

    if (!appointmentId || !patientId || !testName) {
      return NextResponse.json(
        { error: "appointmentId, patientId, and testName are required" },
        { status: 400 }
      );
    }

    const validUrgencies = ["ROUTINE", "URGENT", "STAT"];
    if (urgency && !validUrgencies.includes(urgency)) {
      return NextResponse.json({ error: "Invalid urgency value" }, { status: 400 });
    }

    const order = await prisma.labOrder.create({
      data: {
        appointmentId,
        patientId,
        doctorId: doctor.id,
        testCatalogueId: testCatalogueId || null,
        testName,
        urgency: urgency ?? "ROUTINE",
        sampleType: sampleType || null,
        notes: notes || null,
        status: "ORDERED",
      },
      include: {
        testCatalogue: {
          select: { name: true, code: true },
        },
        patient: {
          select: { user: { select: { name: true } } },
        },
      },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("POST Lab Order Error:", error);
    return NextResponse.json({ error: "Failed to create lab order" }, { status: 500 });
  }
}
