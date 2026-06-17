// app/api/billing/invoices/my/route.ts
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const role = (session.user as any).role;
  if (role !== "PATIENT") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    // 1. Get patient.id from session
    const patient = await prisma.patient.findUnique({
      where: { userId: session.user.id }
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient profile not found" }, { status: 404 });
    }

    // 2. Fetch all invoices for patient
    const invoices = await prisma.invoice.findMany({
      where: { patientId: patient.id },
      include: {
        lineItems: true,
        payments: true,
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
    console.error("GET My Invoices Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
