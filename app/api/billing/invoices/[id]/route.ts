// app/api/billing/invoices/[id]/route.ts
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
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
      }
    });

    if (!invoice) {
      return new NextResponse("Invoice Not Found", { status: 404 });
    }

    const { role } = session.user as any;
    // Scoping check: RECEPTIONIST and ADMIN can see everything. Patients can only see their own. Doctors can only see their patients' invoices.
    if (role === "PATIENT") {
      const patient = await prisma.patient.findUnique({ where: { userId: session.user.id } });
      if (!patient || invoice.patientId !== patient.id) {
        return new NextResponse("Forbidden", { status: 403 });
      }
    } else if (role === "DOCTOR") {
      const doctor = await prisma.doctor.findUnique({ where: { userId: session.user.id } });
      if (!doctor || invoice.appointment?.doctorId !== doctor.id) {
        return new NextResponse("Forbidden", { status: 403 });
      }
    } else if (role !== "RECEPTIONIST" && role !== "ADMIN") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Fetch Single Invoice Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
