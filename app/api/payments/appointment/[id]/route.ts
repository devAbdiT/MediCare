// app/api/payments/appointment/[id]/route.ts
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const role = (session.user as any).role;
    
    // Get the appointment and its latest payment
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        payments: {
          orderBy: { createdAt: "desc" },
          take: 1
        },
        patient: {
          include: { user: { select: { name: true, email: true } } }
        },
        doctor: {
          include: { user: { select: { name: true } } }
        }
      }
    });

    if (!appointment) {
      return new NextResponse("Appointment not found", { status: 404 });
    }

    // Role safety
    if (role === "PATIENT") {
      const patientRecord = await prisma.patient.findUnique({ where: { userId: session.user.id }});
      if (!patientRecord || appointment.patientId !== patientRecord.id) {
         return new NextResponse("Forbidden", { status: 403 });
      }
    }

    const latestPayment = appointment.payments[0] || null;

    return NextResponse.json({
      appointment: {
        id: appointment.id,
        dateTime: appointment.dateTime,
        status: appointment.status,
        paymentStatus: appointment.paymentStatus,
        paymentRequired: appointment.paymentRequired,
        appointmentType: appointment.appointmentType,
        priority: appointment.priority,
        patientName: appointment.patient.user.name,
        cardNumber: appointment.patient.cardNumber,
        doctorName: `Dr. ${appointment.doctor.user.name}`
      },
      payment: latestPayment ? {
        id: latestPayment.id,
        txRef: latestPayment.txRef,
        status: latestPayment.status,
        amount: latestPayment.amount,
        currency: latestPayment.currency,
        paidAt: latestPayment.paidAt,
        checkoutUrl: latestPayment.checkoutUrl,
        chapaRefId: latestPayment.chapaRefId
      } : null
    });

  } catch (error) {
    console.error("Payment Fetch Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
