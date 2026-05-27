// app/api/appointments/book-with-payment/route.ts
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { startOfHour, endOfHour } from "date-fns";
import { validateDoctorAvailability } from "@/lib/availability";
import { getAppointmentBookingAmount } from "@/lib/pricing";
import { initializeChapaPayment } from "@/lib/chapa";

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    const { patientId, doctorId, dateTime, reason, appointmentType, priority } = body;

    const requestedTime = new Date(dateTime);
    const startTime = startOfHour(requestedTime);
    const endTime = endOfHour(requestedTime);

    // 1. Doctor Working Hours validation
    const availabilityCheck = await validateDoctorAvailability(doctorId, requestedTime);
    if (!availabilityCheck.valid) {
      return new NextResponse(availabilityCheck.message, { status: 400 });
    }

    // 3. Resolve IDs
    let finalPatientId = patientId;
    const role = (session.user as any).role;
    if (role === "PATIENT") {
      const patient = await prisma.patient.findUnique({ where: { userId: session.user.id } });
      if (!patient) return new NextResponse("Patient not found", { status: 404 });
      finalPatientId = patient.id;
    }

    // 2. Server-side conflict check (ignore cancelled)
    const existing = await prisma.appointment.findFirst({
      where: {
        doctorId,
        dateTime: { gte: startTime, lte: endTime },
        status: { not: "CANCELLED" }
      }
    });

    if (existing) {
      if (existing.status === "PAYMENT_PENDING" && existing.patientId === finalPatientId) {
        // Cancel the old pending/failed appointment to allow retry
        await prisma.appointment.update({
          where: { id: existing.id },
          data: { status: "CANCELLED" }
        });
      } else {
        return new NextResponse("Doctor is already booked for this time slot", { status: 400 });
      }
    }

    const patientRecord = await prisma.patient.findUnique({
      where: { id: finalPatientId },
      include: { user: true }
    });

    if (!patientRecord) {
      return new NextResponse("Patient record not found", { status: 404 });
    }

    const validTypes = ["NEW_VISIT", "FOLLOW_UP", "CONSULTATION", "EMERGENCY"];
    const validPriorities = ["NORMAL", "URGENT", "EMERGENCY"];

    const finalAppointmentType = validTypes.includes(appointmentType) ? appointmentType : "NEW_VISIT";
    const finalPriority = validPriorities.includes(priority) ? priority : "NORMAL";

    // Pricing
    const amount = getAppointmentBookingAmount(finalAppointmentType as any);
    const txRef = `APPT-${new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14)}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // App URL for callback/return
    const { origin } = new URL(req.url);
    const appUrl = origin;

    // 4. Create Appointment and Payment
    // We do this in a transaction so either both succeed or fail
    const result = await prisma.$transaction(async (tx) => {
      const appointment = await tx.appointment.create({
        data: {
          patientId: finalPatientId,
          doctorId,
          dateTime: requestedTime,
          reason,
          appointmentType: finalAppointmentType as any,
          priority: finalPriority as any,
          receptionistId: role === "RECEPTIONIST" ? 
            (await tx.receptionist.findUnique({ where: { userId: session.user.id } }))?.id : 
            null,
          status: "PAYMENT_PENDING",
          paymentStatus: "PENDING",
          paymentRequired: true,
        }
      });

      const payment = await tx.appointmentPayment.create({
        data: {
          appointmentId: appointment.id,
          patientId: finalPatientId,
          status: "PENDING",
          provider: "CHAPA",
          txRef,
          amount,
          currency: "ETB",
          description: `Appointment booking payment - ${finalAppointmentType}`,
        }
      });

      return { appointment, payment };
    });

    try {
      // 5. Initialize Chapa
      const chapaRes = await initializeChapaPayment({
        amount,
        email: patientRecord.user.email,
        first_name: patientRecord.user.name.split(" ")[0],
        last_name: patientRecord.user.name.split(" ").slice(1).join(" ") || "Patient",
        phone_number: patientRecord.user.phone || undefined,
        tx_ref: txRef,
        callback_url: `${appUrl}/api/payments/chapa/callback`,
        return_url: `${appUrl}/dashboard/patient/payments/result?tx_ref=${txRef}`,
        customization: {
          title: "MediCare Booking",
          description: `Appointment booking`
        }
      });

      // Update payment with checkoutUrl and raw response
      await prisma.appointmentPayment.update({
        where: { id: result.payment.id },
        data: {
          checkoutUrl: chapaRes.data.checkout_url,
          rawInitializeResponse: chapaRes
        }
      });

      return NextResponse.json({
        appointmentId: result.appointment.id,
        paymentId: result.payment.id,
        txRef,
        checkoutUrl: chapaRes.data.checkout_url
      });

    } catch (chapaErr: any) {
      // If Chapa fails, mark payment as FAILED
      await prisma.appointmentPayment.update({
        where: { id: result.payment.id },
        data: {
          status: "FAILED",
          failedAt: new Date(),
          rawInitializeResponse: { error: chapaErr.message }
        }
      });

      // We still return the appointment but clearly indicate payment initialization failed
      return new NextResponse(`Payment initialization failed: ${chapaErr.message}`, { status: 500 });
    }

  } catch (error: any) {
    console.error("Booking Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
