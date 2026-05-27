// app/api/payments/chapa/verify/route.ts
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { verifyChapaPayment } from "@/lib/chapa";

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
      include: { appointment: true }
    });

    if (!payment) {
      return new NextResponse("Payment not found", { status: 404 });
    }

    // Role safety
    const role = (session.user as any).role;
    if (role === "PATIENT" && payment.patientId !== session.user.id) {
      // Actually, patientId on payment relates to Patient model. session.user.id is User model.
      const patientRecord = await prisma.patient.findUnique({ where: { userId: session.user.id }});
      if (!patientRecord || payment.patientId !== patientRecord.id) {
         return new NextResponse("Forbidden", { status: 403 });
      }
    }

    // Call Chapa verify endpoint
    let chapaRes;
    try {
      chapaRes = await verifyChapaPayment(tx_ref);
    } catch (err: any) {
      return new NextResponse(`Chapa Verify Error: ${err.message}`, { status: 500 });
    }

    // Inspect Chapa response status
    if (chapaRes.status === "success" || (chapaRes.data && chapaRes.data.status === "success")) {
      // Payment is successful
      if (payment.status !== "PAID") {
        await prisma.$transaction(async (tx) => {
          await tx.appointmentPayment.update({
            where: { id: payment.id },
            data: {
              status: "PAID",
              paidAt: new Date(),
              chapaRefId: chapaRes.data?.reference || chapaRes.data?.id?.toString() || null,
              rawVerifyResponse: chapaRes
            }
          });

          await tx.appointment.update({
            where: { id: payment.appointmentId },
            data: {
              paymentStatus: "PAID",
              paidAt: new Date(),
              // Only change status to SCHEDULED if it was PAYMENT_PENDING
              status: payment.appointment.status === "PAYMENT_PENDING" ? "SCHEDULED" : undefined
            }
          });
        });
      }

      return NextResponse.json({ status: "success", paymentStatus: "PAID" });
    } else {
      // Payment failed or abandoned
      if (payment.status !== "FAILED" && payment.status !== "PAID") {
        await prisma.$transaction(async (tx) => {
          await tx.appointmentPayment.update({
            where: { id: payment.id },
            data: {
              status: "FAILED",
              failedAt: new Date(),
              rawVerifyResponse: chapaRes
            }
          });
          // Do NOT mark appointment as SCHEDULED
        });
      }
      return NextResponse.json({ status: "failed", paymentStatus: "FAILED" });
    }

  } catch (error: any) {
    console.error("Payment Verify Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
