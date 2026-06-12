// app/api/billing/invoices/[id]/receipt/route.ts
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

  const role = (session.user as any).role;
  if (role !== "RECEPTIONIST" && role !== "ADMIN") {
    return new NextResponse("Forbidden", { status: 403 });
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

    const todayStr = new Date().toLocaleDateString(undefined, {
      month: "long",
      day: "numeric",
      year: "numeric"
    });

    const apptDateStr = invoice.appointment?.dateTime
      ? new Date(invoice.appointment.dateTime).toLocaleDateString(undefined, {
          month: "long",
          day: "numeric",
          year: "numeric"
        })
      : "N/A";

    const totalAmount = Number(invoice.totalAmount);
    const discountAmt = Number(invoice.discountAmt);
    const paidAmount = Number(invoice.paidAmount);
    const balanceDue = totalAmount - paidAmount;

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Receipt - ${invoice.invoiceNumber}</title>
    <style>
        body {
            font-family: 'Courier New', Courier, monospace;
            color: #000;
            background-color: #fff;
            margin: 0;
            padding: 20px;
            font-size: 14px;
            line-height: 1.5;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        .text-center {
            text-align: center;
        }
        .text-right {
            text-align: right;
        }
        .header {
            margin-bottom: 30px;
        }
        .header h1 {
            font-size: 24px;
            font-weight: bold;
            margin: 0 0 5px 0;
            text-transform: uppercase;
        }
        .header h2 {
            font-size: 16px;
            margin: 0;
            letter-spacing: 1px;
            text-transform: uppercase;
        }
        .divider {
            border-top: 2px dashed #000;
            margin: 20px 0;
        }
        .meta-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
        }
        .meta-section h3 {
            font-size: 14px;
            text-transform: uppercase;
            margin: 0 0 8px 0;
            font-weight: bold;
            text-decoration: underline;
        }
        .meta-section p {
            margin: 4px 0;
        }
        .receipt-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        .receipt-table th {
            border-bottom: 2px dashed #000;
            border-top: 2px dashed #000;
            padding: 8px;
            font-weight: bold;
            text-align: left;
            text-transform: uppercase;
        }
        .receipt-table td {
            padding: 8px;
            border-bottom: 1px dashed #eee;
        }
        .totals-block {
            width: 100%;
            margin-top: 15px;
        }
        .totals-row {
            display: flex;
            justify-content: flex-end;
            margin: 4px 0;
        }
        .totals-label {
            width: 180px;
            text-align: right;
            font-weight: bold;
        }
        .totals-value {
            width: 120px;
            text-align: right;
        }
        .payment-block {
            margin-top: 25px;
            background-color: #fafafa;
            border: 1px solid #ddd;
            padding: 15px;
        }
        .payment-block h3 {
            margin: 0 0 10px 0;
            font-size: 13px;
            text-transform: uppercase;
            font-weight: bold;
        }
        .payment-row {
            display: flex;
            justify-content: space-between;
            margin: 4px 0;
        }
        .footer {
            margin-top: 50px;
            font-size: 12px;
        }
        .footer p {
            margin: 4px 0;
        }
        .no-print-container {
            display: flex;
            justify-content: center;
            margin-bottom: 30px;
        }
        .btn-print {
            padding: 10px 24px;
            background-color: #1E3A5F;
            color: #fff;
            border: none;
            border-radius: 4px;
            font-weight: bold;
            cursor: pointer;
            text-transform: uppercase;
            font-family: inherit;
        }
        .btn-print:hover {
            background-color: #1A3050;
        }
        @media print {
            .no-print {
                display: none !important;
            }
            body {
                padding: 0;
                margin: 0;
            }
            .container {
                padding: 0;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Print Button (Hidden on Print) -->
        <div class="no-print-container no-print">
            <button class="btn-print" onclick="window.print()">Print Receipt</button>
        </div>

        <!-- JUMC Official Header -->
        <div class="header text-center">
            <h1>Jimma University Medical Center</h1>
            <h2>Official Payment Receipt</h2>
        </div>

        <div class="divider"></div>

        <!-- Meta Grid Info -->
        <div class="meta-grid">
            <div class="meta-section">
                <h3>Patient Information</h3>
                <p><strong>Name:</strong> ${invoice.patient.user.name}</p>
                <p><strong>Card Number:</strong> ${invoice.patient.cardNumber || "N/A"}</p>
                <p><strong>Phone:</strong> ${invoice.patient.user.phone || "N/A"}</p>
            </div>
            <div class="meta-section" style="text-align: right;">
                <h3>Receipt Information</h3>
                <p><strong>Receipt No:</strong> ${invoice.invoiceNumber}</p>
                <p><strong>Date Issued:</strong> ${todayStr}</p>
                <p><strong>Appointment Date:</strong> ${apptDateStr}</p>
                <p><strong>Doctor:</strong> Dr. ${invoice.appointment?.doctor?.user?.name || "N/A"} (${invoice.appointment?.doctor?.specialization || "General Specialist"})</p>
            </div>
        </div>

        <!-- Line Items Table -->
        <table class="receipt-table">
            <thead>
                <tr>
                    <th>Item Description</th>
                    <th style="text-align: center; width: 80px;">Qty</th>
                    <th style="text-align: right; width: 150px;">Unit Price (ETB)</th>
                    <th style="text-align: right; width: 150px;">Total (ETB)</th>
                </tr>
            </thead>
            <tbody>
                ${invoice.lineItems
                  .map(
                    (item) => `
                    <tr>
                        <td>${item.description}</td>
                        <td style="text-align: center;">${item.quantity}</td>
                        <td style="text-align: right;">${Number(item.unitPrice).toFixed(2)}</td>
                        <td style="text-align: right; font-weight: bold;">${Number(item.totalPrice).toFixed(2)}</td>
                    </tr>
                `
                  )
                  .join("")}
            </tbody>
        </table>

        <!-- Totals Block -->
        <div class="totals-block">
            <div class="totals-row">
                <div class="totals-label">Subtotal:</div>
                <div class="totals-value">ETB ${totalAmount.toFixed(2)}</div>
            </div>
            ${
              discountAmt > 0
                ? `
            <div class="totals-row">
                <div class="totals-label">Discount:</div>
                <div class="totals-value">ETB ${discountAmt.toFixed(2)}</div>
            </div>
            `
                : ""
            }
            <div class="totals-row" style="font-size: 16px; font-weight: bold;">
                <div class="totals-label">Total Amount:</div>
                <div class="totals-value" style="border-top: 1px dashed #000; padding-top: 4px;">ETB ${totalAmount.toFixed(2)}</div>
            </div>
        </div>

        <div class="divider"></div>

        <!-- Payments Log -->
        ${
          invoice.payments.length > 0
            ? invoice.payments
                .map(
                  (payment, idx) => `
            <div class="payment-block" style="margin-bottom: 10px;">
                <h3>Payment Section (Transaction #${idx + 1})</h3>
                <div class="payment-row">
                    <span><strong>Amount Paid:</strong> ETB ${Number(payment.amount).toFixed(2)}</span>
                    <span><strong>Method:</strong> ${payment.method}</span>
                </div>
                <div class="payment-row">
                    <span><strong>Reference:</strong> ${payment.reference || "N/A"}</span>
                    <span><strong>Payment Date:</strong> ${new Date(payment.receivedAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric"
                    })}</span>
                </div>
            </div>
        `
                )
                .join("")
            : `
            <div class="payment-block">
                <p style="margin: 0; font-style: italic; color: #777;">No payments recorded against this invoice yet.</p>
            </div>
        `
        }

        <!-- Balance Due (Only if PARTIAL) -->
        ${
          invoice.status === "PARTIAL"
            ? `
            <div class="totals-row" style="font-size: 15px; font-weight: bold; color: red; margin-top: 15px;">
                <div class="totals-label">Balance Due:</div>
                <div class="totals-value">ETB ${Math.max(0, balanceDue).toFixed(2)}</div>
            </div>
        `
            : ""
        }

        <div class="divider"></div>

        <!-- Footer -->
        <div class="footer text-center">
            <p><strong>Thank you for choosing JUMC</strong></p>
            <p>This is an official receipt issued by Jimma University Medical Center Front Desk Operations.</p>
        </div>
    </div>
</body>
</html>
    `;

    return new Response(htmlContent, {
      headers: {
        "Content-Type": "text/html"
      }
    });
  } catch (error) {
    console.error("Official Receipt Generation Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
