// app/api/billing/invoices/route.ts
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

// GET /api/billing/invoices - Retrieve billing invoices with filters (RECEPTIONIST/ADMIN)
export async function GET(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const role = (session.user as any).role;
  if (role !== "RECEPTIONIST" && role !== "ADMIN") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const whereClause: any = {};
    
    if (status && status !== "ALL") {
      whereClause.status = status;
    }
    
    if (from || to) {
      whereClause.createdAt = {};
      if (from) {
        const fromDate = new Date(from);
        if (!isNaN(fromDate.getTime())) {
          whereClause.createdAt.gte = fromDate;
        }
      }
      if (to) {
        const toDate = new Date(to);
        if (!isNaN(toDate.getTime())) {
          // Set to the very end of that day
          toDate.setHours(23, 59, 59, 999);
          whereClause.createdAt.lte = toDate;
        }
      }
    }

    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      include: {
        lineItems: true,
        payments: true,
        patient: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                phone: true
              }
            }
          }
        },
        appointment: {
          include: {
            doctor: {
              include: {
                user: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(invoices);
  } catch (error) {
    console.error("Fetch Invoices Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
