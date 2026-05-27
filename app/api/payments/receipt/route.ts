// app/api/payments/receipt/route.ts
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

  const { searchParams } = new URL(req.url);
  const tx_ref = searchParams.get("tx_ref");

  if (!tx_ref) {
    return new NextResponse("Missing tx_ref", { status: 400 });
  }

  try {
    const payment = await prisma.appointmentPayment.findUnique({
      where: { txRef: tx_ref },
      include: {
        appointment: {
          include: {
            patient: { include: { user: { select: { name: true, email: true } } } },
            doctor: { include: { user: { select: { name: true } } } }
          }
        }
      }
    });

    if (!payment) {
      return new NextResponse("Payment not found", { status: 404 });
    }

    // Role safety
    const role = (session.user as any).role;
    if (role === "PATIENT") {
      const patientRecord = await prisma.patient.findUnique({ where: { userId: session.user.id }});
      if (!patientRecord || payment.patientId !== patientRecord.id) {
         return new NextResponse("Forbidden", { status: 403 });
      }
    }

    return NextResponse.json({
      appointment: {
        id: payment.appointment.id,
        dateTime: payment.appointment.dateTime,
        status: payment.appointment.status,
        paymentStatus: payment.appointment.paymentStatus,
        paymentRequired: payment.appointment.paymentRequired,
        appointmentType: payment.appointment.appointmentType,
        priority: payment.appointment.priority,
        patientName: payment.appointment.patient.user.name,
        cardNumber: payment.appointment.patient.cardNumber,
        doctorName: `Dr. ${payment.appointment.doctor.user.name}`
      },
      payment: {
        id: payment.id,
        txRef: payment.txRef,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        paidAt: payment.paidAt,
        checkoutUrl: payment.checkoutUrl,
        chapaRefId: payment.chapaRefId
      }
    });

  } catch (error) {
    console.error("Receipt Fetch Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
