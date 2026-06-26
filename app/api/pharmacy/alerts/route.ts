import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { differenceInDays } from "date-fns";

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

    const drugs = await prisma.drug.findMany({
      where: { isActive: true },
      include: {
        stocks: {
          where: { quantity: { gt: 0 } }, // Only look at batches that have stock left
        },
      },
    });

    const now = new Date();
    const outOfStock: any[] = [];
    const lowStock: any[] = [];
    const expiringSoon: any[] = [];
    const expired: any[] = [];

    for (const drug of drugs) {
      const totalStock = drug.stocks.reduce((acc, stock) => acc + stock.quantity, 0);

      if (totalStock === 0) {
        outOfStock.push({ drug });
      } else if (totalStock <= drug.reorderLevel) {
        lowStock.push({
          drug,
          totalStock,
          reorderLevel: drug.reorderLevel,
          deficit: drug.reorderLevel - totalStock,
        });
      }

      for (const stock of drug.stocks) {
        if (stock.expiryDate) {
          const daysLeft = differenceInDays(stock.expiryDate, now);
          if (daysLeft < 0) {
            expired.push({
              drug,
              batch: stock.batchNumber,
              expiredAt: stock.expiryDate,
              qty: stock.quantity,
            });
          } else if (daysLeft <= 30) {
            expiringSoon.push({
              drug,
              batch: stock.batchNumber,
              expiryDate: stock.expiryDate,
              daysLeft,
              qty: stock.quantity,
            });
          }
        }
      }
    }

    return NextResponse.json({
      outOfStock,
      lowStock,
      expiringSoon,
      expired,
      summary: {
        totalAlerts: outOfStock.length + lowStock.length + expiringSoon.length + expired.length,
        stockAlerts: outOfStock.length + lowStock.length,
        expiryAlerts: expiringSoon.length + expired.length,
      }
    });
  } catch (error) {
    console.error("GET Alerts Error:", error);
    return NextResponse.json({ error: "Failed to fetch alerts" }, { status: 500 });
  }
}
