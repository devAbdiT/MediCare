import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { startOfDay, endOfDay, subDays, eachDayOfInterval, format } from "date-fns";

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    const endDate = toParam ? endOfDay(new Date(toParam)) : endOfDay(new Date());
    const startDate = fromParam ? startOfDay(new Date(fromParam)) : startOfDay(subDays(endDate, 30));

    // Fetch invoices in date range
    const invoices = await prisma.invoice.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        payments: true,
        lineItems: {
          include: {
            service: true
          }
        }
      }
    });

    // Compute Summary
    let totalInvoiced = 0;
    let totalCollected = 0;
    let paidCount = 0;
    let pendingCount = 0;

    for (const inv of invoices) {
      if (inv.status !== "CANCELLED" && inv.status !== "WAIVED") {
        totalInvoiced += Number(inv.totalAmount);
        totalCollected += Number(inv.paidAmount);
      }
      if (inv.status === "PAID") paidCount++;
      if (inv.status === "PENDING" || inv.status === "PARTIAL") pendingCount++;
    }

    const totalOutstanding = totalInvoiced - totalCollected;

    // Compute Daily Revenue
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const dailyRevenue = days.map(day => {
      const dayStr = format(day, "yyyy-MM-dd");
      
      const dayInvoices = invoices.filter(inv => 
        format(new Date(inv.createdAt), "yyyy-MM-dd") === dayStr && 
        inv.status !== "CANCELLED" && inv.status !== "WAIVED"
      );
      
      const dayInvoiced = dayInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
      
      return {
        date: format(day, "MMM dd"),
        invoiced: dayInvoiced,
        collected: 0 // Will compute next
      };
    });

    const payments = await prisma.payment.findMany({
      where: {
        receivedAt: {
          gte: startDate,
          lte: endDate,
        }
      }
    });

    const byPaymentMethodMap: Record<string, number> = {};

    payments.forEach(payment => {
      const dayStr = format(new Date(payment.receivedAt), "MMM dd");
      const dayData = dailyRevenue.find(d => d.date === dayStr);
      if (dayData) {
        dayData.collected += Number(payment.amount);
      }

      const method = payment.method;
      byPaymentMethodMap[method] = (byPaymentMethodMap[method] || 0) + Number(payment.amount);
    });

    const byPaymentMethod = Object.entries(byPaymentMethodMap).map(([method, amount]) => ({
      method,
      amount
    }));

    // Compute By Category
    const byCategoryMap: Record<string, number> = {};
    invoices.forEach(inv => {
      if (inv.status !== "CANCELLED" && inv.status !== "WAIVED") {
        inv.lineItems.forEach(item => {
          let cat = item.service?.category || "Other";
          if (item.description.includes("(Laboratory)")) {
            cat = "LABORATORY";
          }
          byCategoryMap[cat] = (byCategoryMap[cat] || 0) + Number(item.totalPrice);
        });
      }
    });

    const byCategory = Object.entries(byCategoryMap).map(([category, amount]) => ({
      category,
      amount
    }));

    return NextResponse.json({
      summary: {
        totalInvoiced,
        totalCollected,
        totalOutstanding,
        invoiceCount: invoices.length,
        paidCount,
        pendingCount
      },
      dailyRevenue,
      byPaymentMethod,
      byCategory
    });

  } catch (error) {
    console.error("GET Revenue Report Error:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
