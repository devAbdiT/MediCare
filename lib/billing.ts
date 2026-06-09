// lib/billing.ts
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

/**
 * Generate a unique invoice number in the format INV-YYYY-XXXX
 * e.g. INV-2026-0001, INV-2026-0042
 */
export async function generateInvoiceNumber(): Promise<string> {
  const count = await prisma.invoice.count();
  const year = new Date().getFullYear();
  const seq = String(count + 1).padStart(4, "0");
  return `INV-${year}-${seq}`;
}

/**
 * Create a consultation invoice (and its single line item) inside an existing
 * Prisma transaction.
 *
 * Fee lookup priority:
 *   1. doctor.consultationFee  (if set and > 0)
 *   2. doctor.department.consultationFee
 *   3. Default: 0
 *
 * Safe to call even when an invoice for this appointmentId already exists —
 * duplicate unique-constraint errors are caught and silently skipped.
 */
export async function createConsultationInvoice(
  tx: Prisma.TransactionClient,
  {
    patientId,
    appointmentId,
    doctorId,
    createdById,
  }: {
    patientId: string;
    appointmentId: string;
    doctorId: string;
    createdById: string;
  }
): Promise<void> {
  try {
    // ── 1. Resolve the fee ────────────────────────────────────────────────────
    const doctor = await tx.doctor.findUnique({
      where: { id: doctorId },
      select: {
        consultationFee: true,
        department: { select: { consultationFee: true } },
      },
    });

    let fee = 0;
    if (doctor?.consultationFee && Number(doctor.consultationFee) > 0) {
      fee = Number(doctor.consultationFee);
    } else if (
      doctor?.department?.consultationFee &&
      Number(doctor.department.consultationFee) > 0
    ) {
      fee = Number(doctor.department.consultationFee);
    }

    // ── 2. Generate invoice number (uses main prisma client for count) ────────
    // We cannot use the tx client for count here because it's a read within the
    // same transaction and the invoice we're about to create doesn't exist yet,
    // so there's no risk of a race condition for a single request.
    const invoiceCount = await tx.invoice.count();
    const year = new Date().getFullYear();
    const seq = String(invoiceCount + 1).padStart(4, "0");
    const invoiceNumber = `INV-${year}-${seq}`;

    // ── 3. Create invoice + line item ─────────────────────────────────────────
    const invoice = await tx.invoice.create({
      data: {
        invoiceNumber,
        patientId,
        appointmentId,
        totalAmount: fee,
        discountAmt: 0,
        paidAmount: 0,
        status: "PENDING",
        createdById,
      },
    });

    await tx.invoiceItem.create({
      data: {
        invoiceId: invoice.id,
        description: "Consultation Fee",
        quantity: 1,
        unitPrice: fee,
        totalPrice: fee,
      },
    });
  } catch (err: any) {
    // P2002 = Prisma unique constraint violation
    // Invoice for this appointmentId already exists — skip silently.
    if (err?.code === "P2002") {
      console.warn(
        `[billing] Invoice already exists for appointment ${appointmentId} — skipping.`
      );
      return;
    }
    // Re-throw any other unexpected error so the transaction rolls back.
    throw err;
  }
}
