// app/api/pharmacy/stock/adjust/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (role !== "PHARMACIST" && role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { drugId, adjustment, reason } = body;

    if (!drugId || adjustment == null || adjustment === 0) {
      return NextResponse.json(
        { error: "drugId, non-zero adjustment, and reason are required" },
        { status: 400 }
      );
    }

    if (!reason || String(reason).trim().length < 3) {
      return NextResponse.json(
        { error: "A reason is required for stock adjustment" },
        { status: 400 }
      );
    }

    const drug = await prisma.drug.findUnique({ where: { id: drugId } });
    if (!drug) {
      return NextResponse.json({ error: "Drug not found" }, { status: 404 });
    }

    // Compute current total stock
    const stockAgg = await prisma.drugStock.aggregate({
      where: { drugId },
      _sum: { quantity: true },
    });
    const currentTotal = stockAgg._sum.quantity ?? 0;
    const newTotal = currentTotal + Number(adjustment);

    if (newTotal < 0) {
      return NextResponse.json(
        { error: `Adjustment would result in negative stock (current: ${currentTotal})` },
        { status: 400 }
      );
    }

    // Create adjustment entry (negative qty for reductions)
    const stockEntry = await prisma.drugStock.create({
      data: {
        drugId,
        quantity: Number(adjustment),
        batchNumber: `ADJ-${Date.now()}`,
        receivedById: session.user.id,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userRole: role,
        action: "STOCK_ADJUSTED",
        entity: "DrugStock",
        entityId: stockEntry.id,
        oldValues: { totalBefore: currentTotal },
        newValues: {
          drugId,
          drugName: drug.name,
          adjustment: Number(adjustment),
          totalAfter: newTotal,
          reason,
        },
      },
    });

    return NextResponse.json({
      success: true,
      drugName: drug.name,
      adjustment: Number(adjustment),
      totalAfter: newTotal,
    });
  } catch (error) {
    console.error("POST Stock Adjust Error:", error);
    return NextResponse.json({ error: "Failed to adjust stock" }, { status: 500 });
  }
}
