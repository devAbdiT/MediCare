// app/api/billing/payments/route.ts
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { PaymentMethod } from "@prisma/client";

export async function POST(req: Request) {
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
    const body = await req.json();
    const { invoiceId, amount: rawAmount, method, reference, notes } = body;

    if (!invoiceId || rawAmount === undefined || !method) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const amount = parseFloat(rawAmount);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ message: "Amount must be a positive number" }, { status: 400 });
    }

    // Validate method
    if (!Object.values(PaymentMethod).includes(method)) {
      return NextResponse.json({ message: `Invalid payment method: ${method}` }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({
        where: { id: invoiceId },
      });

      if (!invoice) {
        throw new Error("INVOICE_NOT_FOUND");
      }

      const totalAmount = Number(invoice.totalAmount);
      const paidAmount = Number(invoice.paidAmount);
      const balance = Number((totalAmount - paidAmount).toFixed(2));

      if (amount > balance) {
        throw new Error("AMOUNT_EXCEEDS_BALANCE");
      }

      const newPaidAmount = Number((paidAmount + amount).toFixed(2));
      const newStatus = newPaidAmount >= totalAmount ? "PAID" : "PARTIAL";

      const payment = await tx.payment.create({
        data: {
          invoiceId,
          amount,
          method,
          reference: reference?.trim() || null,
          notes: notes?.trim() || null,
          receivedById: session.user.id,
        },
      });

      const updatedInvoice = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          paidAmount: newPaidAmount,
          status: newStatus,
        },
      });

      return { payment, updatedInvoice };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Record Payment Error:", error);
    if (error.message === "INVOICE_NOT_FOUND") {
      return NextResponse.json({ message: "Invoice not found" }, { status: 404 });
    }
    if (error.message === "AMOUNT_EXCEEDS_BALANCE") {
      return NextResponse.json({ message: "Payment amount exceeds the remaining balance" }, { status: 400 });
    }
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
