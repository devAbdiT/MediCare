// app/api/lab/results/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * POST /api/lab/results
 * Only LABTECH or ADMIN can enter lab results.
 *
 * Body: { labOrderId, resultValue, unit?, referenceRange?, isAbnormal?, interpretation? }
 */
export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any).role as string;
    if (!["LABTECH", "ADMIN"].includes(role)) {
      return NextResponse.json({ error: "Only LABTECH or ADMIN can enter lab results" }, { status: 403 });
    }

    const body = await req.json();
    const { labOrderId, resultValue, unit, referenceRange, isAbnormal, interpretation } = body;

    if (!labOrderId || !resultValue) {
      return NextResponse.json({ error: "labOrderId and resultValue are required" }, { status: 400 });
    }

    // Check if the lab order exists
    const order = await prisma.labOrder.findUnique({
      where: { id: labOrderId },
    });

    if (!order) {
      return NextResponse.json({ error: "Lab order not found" }, { status: 404 });
    }

    if (order.status === "CANCELLED") {
      return NextResponse.json({ error: "Cannot submit results for a cancelled order" }, { status: 422 });
    }

    // Submit result and update order status to RESULTED in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the lab result
      const newResult = await tx.labResult.create({
        data: {
          labOrderId,
          resultValue,
          unit: unit || null,
          referenceRange: referenceRange || null,
          isAbnormal: !!isAbnormal,
          interpretation: interpretation || null,
          enteredById: (session.user as any).id,
        },
      });

      // Update lab order status to RESULTED
      await tx.labOrder.update({
        where: { id: labOrderId },
        data: { status: "RESULTED" },
      });

      return newResult;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("POST Lab Result Error:", error);
    return NextResponse.json({ error: "Failed to submit lab result" }, { status: 500 });
  }
}

/**
 * GET /api/lab/results?orderId=X
 * Return result for a given orderId
 */
export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    const result = await prisma.labResult.findUnique({
      where: { labOrderId: orderId },
      include: {
        labOrder: {
          include: { testCatalogue: true }
        }
      }
    });

    if (!result) return NextResponse.json({ error: "Result not found" }, { status: 404 });

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET Lab Result Error:", error);
    return NextResponse.json({ error: "Failed to fetch lab result" }, { status: 500 });
  }
}

