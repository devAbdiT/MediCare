// app/api/pharmacy/stock/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { addDays } from "date-fns";

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (role !== "PHARMACIST" && role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const thirtyDaysFromNow = addDays(new Date(), 30);

    const drugs = await prisma.drug.findMany({
      orderBy: { name: "asc" },
      include: {
        stocks: {
          orderBy: { receivedAt: "desc" },
        },
      },
    });

    const result = drugs.map((drug: any) => {
      const totalStock = drug.stocks.reduce(
        (sum: number, s: any) => sum + s.quantity,
        0
      );

      const isLowStock = totalStock <= drug.reorderLevel;
      const isOutOfStock = totalStock <= 0;

      const isExpiringSoon = drug.stocks.some(
        (s: any) =>
          s.expiryDate &&
          s.expiryDate <= thirtyDaysFromNow &&
          s.quantity > 0
      );

      return {
        ...drug,
        totalStock,
        isLowStock,
        isOutOfStock,
        isExpiringSoon,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET Stock Error:", error);
    return NextResponse.json({ error: "Failed to fetch stock" }, { status: 500 });
  }
}

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
    const { drugId, quantity, batchNumber, expiryDate } = body;

    if (!drugId || quantity == null || quantity <= 0) {
      return NextResponse.json(
        { error: "drugId and a positive quantity are required" },
        { status: 400 }
      );
    }

    // Confirm drug exists
    const drug = await prisma.drug.findUnique({ where: { id: drugId } });
    if (!drug) {
      return NextResponse.json({ error: "Drug not found" }, { status: 404 });
    }

    const stock = await prisma.drugStock.create({
      data: {
        drugId,
        quantity: Number(quantity),
        batchNumber: batchNumber || null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        receivedById: session.user.id,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userRole: role,
        action: "STOCK_ADDED",
        entity: "DrugStock",
        entityId: stock.id,
        newValues: {
          drugId,
          drugName: drug.name,
          quantity,
          batchNumber,
          expiryDate,
        },
      },
    });

    return NextResponse.json(stock);
  } catch (error) {
    console.error("POST Stock Error:", error);
    return NextResponse.json({ error: "Failed to add stock" }, { status: 500 });
  }
}
