// app/api/lab/orders/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * GET /api/lab/orders
 * Returns lab orders for the LABTECH dashboard.
 *
 * Query params:
 *   ?queue=true  → only non-cancelled, non-resulted orders (pending work queue)
 *   (no param)   → all orders (for stats computation)
 */
export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any).role as string;
    if (role !== "LABTECH" && role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const queueOnly = searchParams.get("queue") === "true";

    const orders = await prisma.labOrder.findMany({
      where: queueOnly
        ? {
            status: {
              in: ["ORDERED", "SAMPLE_COLLECTED", "PROCESSING"],
            },
          }
        : undefined,
      include: {
        patient: {
          select: {
            cardNumber: true,
            user: { select: { name: true } },
          },
        },
        doctor: {
          select: {
            user: { select: { name: true } },
          },
        },
        testCatalogue: {
          select: { name: true, code: true, category: true },
        },
      },
      orderBy: { orderedAt: "asc" },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("GET Lab Orders Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch lab orders" },
      { status: 500 }
    );
  }
}
