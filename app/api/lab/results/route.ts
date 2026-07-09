// app/api/lab/results/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { createAuditLog } from "@/lib/audit";

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
      include: { testCatalogue: true },
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

      // Add billing integration
      const price = Number(order.testCatalogue?.price || 0);
      if (order.appointmentId && price > 0) {
        const invoice = await tx.invoice.findFirst({
          where: { appointmentId: order.appointmentId },
        });

        if (invoice) {
          await tx.invoiceItem.create({
            data: {
              invoiceId: invoice.id,
              description: `${order.testName} (Laboratory)`,
              quantity: 1,
              unitPrice: price,
              totalPrice: price,
            },
          });

          const newTotal = Number(invoice.totalAmount) + price;
          const newStatus = invoice.status === "PAID" ? "PARTIAL" : invoice.status;

          await tx.invoice.update({
            where: { id: invoice.id },
            data: {
              totalAmount: newTotal,
              status: newStatus,
            },
          });
        }
      }

      return newResult;
    });

    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "127.0.0.1";
    await createAuditLog({
      userId: session.user.id,
      userRole: role,
      action: "CREATE",
      entity: "LabResult",
      entityId: result.id,
      newValues: { labOrderId, resultValue, unit, referenceRange, isAbnormal, interpretation },
      ipAddress,
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

