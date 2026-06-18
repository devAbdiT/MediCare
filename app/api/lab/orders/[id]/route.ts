// app/api/lab/orders/[id]/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

type Params = { params: Promise<{ id: string }> };

// Valid status transitions
const VALID_TRANSITIONS: Record<string, string[]> = {
  ORDERED:          ["SAMPLE_COLLECTED", "CANCELLED"],
  SAMPLE_COLLECTED: ["PROCESSING", "CANCELLED"],
  PROCESSING:       ["RESULTED", "CANCELLED"],
  RESULTED:         [],          // terminal — no further transitions
  CANCELLED:        [],          // terminal
};

// ── GET /api/lab/orders/[id] ───────────────────────────────────────────────
export async function GET(req: Request, { params }: Params) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any).role as string;
    if (!["DOCTOR", "LABTECH", "ADMIN"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const order = await prisma.labOrder.findUnique({
      where: { id },
      include: {
        patient: {
          include: {
            user: { select: { name: true, email: true, phone: true } },
            allergies: true,
          },
        },
        doctor: {
          include: { user: { select: { name: true, email: true } } },
        },
        testCatalogue: true,
        result: true,
        appointment: {
          select: { id: true, dateTime: true, status: true },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Lab order not found" }, { status: 404 });
    }

    // DOCTOR can only see their own orders
    if (role === "DOCTOR") {
      const doctor = await prisma.doctor.findUnique({
        where: { userId: (session.user as any).id },
        select: { id: true },
      });
      if (!doctor || order.doctorId !== doctor.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("GET Lab Order [id] Error:", error);
    return NextResponse.json({ error: "Failed to fetch lab order" }, { status: 500 });
  }
}

// ── PATCH /api/lab/orders/[id] ─────────────────────────────────────────────
export async function PATCH(req: Request, { params }: Params) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any).role as string;
    if (!["LABTECH", "ADMIN"].includes(role)) {
      return NextResponse.json({ error: "Only LABTECH or ADMIN can update orders" }, { status: 403 });
    }

    const { id } = await params;

    const existing = await prisma.labOrder.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Lab order not found" }, { status: 404 });
    }

    const body = await req.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: "status is required" }, { status: 400 });
    }

    const allowedNext = VALID_TRANSITIONS[existing.status] ?? [];
    if (!allowedNext.includes(status)) {
      return NextResponse.json(
        {
          error: `Cannot transition from ${existing.status} → ${status}. Allowed: ${allowedNext.join(", ") || "none"}`,
        },
        { status: 422 }
      );
    }

    const updated = await prisma.labOrder.update({
      where: { id },
      data: { status },
      include: {
        patient: {
          include: { user: { select: { name: true, email: true, phone: true } } },
        },
        doctor: {
          include: { user: { select: { name: true } } },
        },
        testCatalogue: true,
        result: true,
        appointment: { select: { id: true, dateTime: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH Lab Order [id] Error:", error);
    return NextResponse.json({ error: "Failed to update lab order" }, { status: 500 });
  }
}
