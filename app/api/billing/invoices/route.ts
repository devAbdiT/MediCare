// app/api/billing/invoices/route.ts
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

// GET /api/billing/invoices - Retrieve billing invoices
export async function GET(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const appointmentId = searchParams.get("appointmentId");

    const whereClause: any = {};
    if (appointmentId) {
      whereClause.appointmentId = appointmentId;
    }

    const role = (session.user as any).role;
    if (role === "PATIENT") {
      const patient = await prisma.patient.findUnique({ where: { userId: session.user.id } });
      if (patient) {
        whereClause.patientId = patient.id;
      } else {
        return NextResponse.json([]);
      }
    } else if (role === "DOCTOR") {
      const doctor = await prisma.doctor.findUnique({ where: { userId: session.user.id } });
      if (doctor) {
        whereClause.appointment = { doctorId: doctor.id };
      } else {
        return NextResponse.json([]);
      }
    }

    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      include: {
        lineItems: true,
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
