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
    if (role === "PATIENT") {
      const patient = await prisma.patient.findUnique({ where: { userId: session.user.id } });
      if (!patient || invoice.patientId !== patient.id) {
        return new NextResponse("Forbidden", { status: 403 });
      }
    } else if (role !== "RECEPTIONIST" && role !== "ADMIN") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Receipt - ${invoice.invoiceNumber}</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800;900&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Outfit', sans-serif;
            color: #1A2A4A;
            background-color: #fff;
            margin: 0;
            padding: 40px;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            border: 1px solid #D0DCE8;
            border-radius: 24px;
            padding: 40px;
            box-shadow: 0 10px 30px rgba(30, 58, 95, 0.05);
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #F0F4F8;
            padding-bottom: 24px;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 26px;
            font-weight: 900;
            color: #1E3A5F;
            letter-spacing: -0.5px;
        }
        .receipt-title {
            font-size: 18px;
            font-weight: 800;
            color: #1E4A8A;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            background-color: #EBF3FC;
            padding: 8px 16px;
            border-radius: 12px;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-bottom: 40px;
        }
        .info-section h3 {
            margin-top: 0;
            font-size: 11px;
            text-transform: uppercase;
            color: #5A6E8A;
            letter-spacing: 1.5px;
            margin-bottom: 12px;
            font-weight: 800;
        }
        .info-section p {
            margin: 0;
            font-weight: 600;
            font-size: 14px;
            line-height: 1.6;
        }
        .table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        .table th {
            text-align: left;
            padding: 12px;
            font-size: 11px;
            text-transform: uppercase;
            color: #5A6E8A;
            letter-spacing: 1px;
            border-bottom: 2px solid #F0F4F8;
            font-weight: 800;
        }
        .table td {
            padding: 18px 12px;
            font-size: 14px;
            border-bottom: 1px solid #F0F4F8;
            font-weight: 600;
        }
        .table td.amount-col {
            text-align: right;
            font-weight: 800;
        }
        .totals-section {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            margin-bottom: 40px;
        }
        .total-row {
            display: flex;
            justify-content: space-between;
            width: 280px;
            padding: 10px 0;
            font-size: 14px;
            font-weight: 600;
        }
        .total-row.grand-total {
            font-size: 20px;
            font-weight: 900;
            color: #1E3A5F;
            border-top: 3px solid #1E3A5F;
            padding-top: 14px;
            margin-top: 8px;
        }
        .payments-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 24px;
            border: 1px solid #E2E8F0;
            border-radius: 16px;
            overflow: hidden;
        }
        .payments-table th {
            background-color: #F8FAFC;
            padding: 12px;
            font-size: 11px;
            color: #5A6E8A;
            text-transform: uppercase;
            font-weight: 800;
            border-bottom: 1px solid #E2E8F0;
        }
        .payments-table td {
            padding: 14px 12px;
            font-size: 13px;
            text-align: center;
            border-bottom: 1px solid #E2E8F0;
            font-weight: 600;
        }
        .payments-table tr:last-child td {
            border-bottom: none;
        }
        .footer {
            text-align: center;
            font-size: 13px;
            color: #5A6E8A;
            margin-top: 60px;
            border-top: 2px solid #F0F4F8;
            padding-top: 24px;
        }
        .btn-print {
            margin-top: 24px;
            padding: 12px 28px;
            background-color: #1E4A8A;
            color: white;
            border: none;
            border-radius: 14px;
            font-weight: 800;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 1px;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(30, 74, 138, 0.2);
            transition: all 0.2s ease;
        }
        .btn-print:hover {
            background-color: #163C70;
            transform: translateY(-1px);
        }
        @media print {
            body {
                padding: 0;
            }
            .container {
                border: none;
                box-shadow: none;
                padding: 0;
            }
            .no-print {
                display: none !important;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">MediCare Clinic</div>
            <div class="receipt-title">Receipt / Invoice</div>
        </div>

        <div class="info-grid">
            <div class="info-section">
                <h3>Billed To</h3>
                <p style="font-size: 16px; color: #1E3A5F; font-weight: 800;">${invoice.patient.user.name}</p>
                <p style="color: #5A6E8A;">Email: ${invoice.patient.user.email || 'N/A'}</p>
                <p style="color: #5A6E8A;">Phone: ${invoice.patient.user.phone || 'N/A'}</p>
            </div>
            <div class="info-section" style="text-align: right;">
                <h3>Billing Info</h3>
                <p>Invoice No: <strong style="color: #1E3A5F;">${invoice.invoiceNumber}</strong></p>
                <p>Date Generated: ${new Date(invoice.createdAt).toLocaleDateString()}</p>
                <p>Doctor: Dr. ${invoice.appointment?.doctor?.user?.name || 'N/A'}</p>
                <p>Status: <span style="
                    color: ${invoice.status === 'PAID' ? '#10B981' : invoice.status === 'PARTIAL' ? '#F59E0B' : '#EF4444'};
                    font-weight: 800;
                ">${invoice.status}</span></p>
            </div>
        </div>

        <table class="table">
            <thead>
                <tr>
                    <th>Item Description</th>
                    <th style="text-align: center;">Qty</th>
                    <th style="text-align: right;">Unit Price</th>
                    <th style="text-align: right;">Total</th>
                </tr>
            </thead>
            <tbody>
                ${invoice.lineItems.map(item => `
                    <tr>
                        <td>${item.description}</td>
                        <td style="text-align: center;">${item.quantity}</td>
                        <td style="text-align: right;">ETB ${Number(item.unitPrice).toFixed(2)}</td>
                        <td style="text-align: right; font-weight: 800; color: #1E3A5F;">ETB ${Number(item.totalPrice).toFixed(2)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        <div class="totals-section">
            <div class="total-row">
                <span style="color: #5A6E8A;">Subtotal:</span>
                <span>ETB ${Number(invoice.totalAmount).toFixed(2)}</span>
            </div>
            <div class="total-row">
                <span style="color: #5A6E8A;">Discount:</span>
                <span>ETB ${Number(invoice.discountAmt).toFixed(2)}</span>
            </div>
            <div class="total-row">
                <span style="color: #5A6E8A;">Total Paid:</span>
                <span style="color: #10B981; font-weight: 800;">ETB ${Number(invoice.paidAmount).toFixed(2)}</span>
            </div>
            <div class="total-row grand-total">
                <span>Balance Due:</span>
                <span>ETB ${Math.max(0, Number(invoice.totalAmount) - Number(invoice.paidAmount)).toFixed(2)}</span>
            </div>
        </div>

        ${invoice.payments.length > 0 ? `
        <div style="margin-top: 40px;">
            <h3 style="margin-bottom: 12px; font-size: 11px; text-transform: uppercase; color: #5A6E8A; letter-spacing: 1.5px; font-weight: 800;">Payments History</h3>
            <table class="payments-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Payment Method</th>
                        <th>Reference</th>
                        <th>Notes</th>
                        <th style="text-align: right; padding-right: 16px;">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${invoice.payments.map(payment => `
                        <tr>
                            <td>${new Date(payment.receivedAt).toLocaleDateString()}</td>
                            <td><span style="background-color: #F1F5F9; padding: 4px 8px; border-radius: 6px; font-size: 11px; text-transform: uppercase;">${payment.method}</span></td>
                            <td>${payment.reference || '-'}</td>
                            <td>${payment.notes || '-'}</td>
                            <td style="font-weight: 800; text-align: right; padding-right: 16px; color: #10B981;">ETB ${Number(payment.amount).toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        ` : ''}

        <div class="footer">
            <p>Thank you for your payment to MediCare Clinic.</p>
            <p style="font-size: 11px; color: #94A3B8; margin-top: 8px;">System Generated Receipt. Signature Not Required.</p>
            <button class="btn-print no-print" onclick="window.print()">Print Receipt</button>
        </div>
    </div>

    <script>
        window.addEventListener('load', () => {
            setTimeout(() => {
                window.print();
            }, 600);
        });
    </script>
</body>
</html>
    `;

    return new Response(htmlContent, {
      headers: {
        "Content-Type": "text/html"
      }
    });
  } catch (error) {
    console.error("Receipt Generation Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
