// app/api/payments/chapa/callback/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyChapaPayment } from "@/lib/chapa";

// This endpoint receives the redirect from Chapa after payment attempt
export async function GET(req: Request) {
  const { searchParams, origin } = new URL(req.url);
  const tx_ref = searchParams.get("tx_ref");

  const appUrl = process.env.NEXT_PUBLIC_BASE_URL || origin;

  if (!tx_ref) {
    return NextResponse.redirect(`${appUrl}/dashboard/patient/payments/result?error=Missing_tx_ref`);
  }

  try {
    const payment = await prisma.appointmentPayment.findUnique({
      where: { txRef: tx_ref },
      include: { appointment: true }
    });

    if (!payment) {
      return NextResponse.redirect(`${appUrl}/dashboard/patient/payments/result?error=Payment_not_found`);
    }

    // Always verify on the backend
    let chapaRes;
    try {
      chapaRes = await verifyChapaPayment(tx_ref);
    } catch (err: any) {
      console.error("Callback Verify Error:", err);
      // We still redirect to the result page so the UI can handle the pending/error state
      return NextResponse.redirect(`${appUrl}/dashboard/patient/payments/result?tx_ref=${tx_ref}`);
    }

    // Inspect Chapa response status
    if (chapaRes.status === "success" || (chapaRes.data && chapaRes.data.status === "success")) {
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
              status: payment.appointment.status === "PAYMENT_PENDING" ? "SCHEDULED" : undefined
            }
          });
        });
      }
    } else {
      if (payment.status !== "FAILED" && payment.status !== "PAID") {
        await prisma.appointmentPayment.update({
          where: { id: payment.id },
          data: {
            status: "FAILED",
            failedAt: new Date(),
            rawVerifyResponse: chapaRes
          }
        });
      }
    }

    // Redirect to the result page
    return NextResponse.redirect(`${appUrl}/dashboard/patient/payments/result?tx_ref=${tx_ref}`);
  } catch (error) {
    console.error("Chapa callback error:", error);
    return NextResponse.redirect(`${appUrl}/dashboard/patient/payments/result?error=Internal_Error`);
  }
}
