// app/api/print/prescription/[recordId]/route.ts
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { differenceInYears } from "date-fns";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ recordId: string }> }
) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { recordId } = await params;

  try {
    const record = await prisma.medicalRecord.findUnique({
      where: { id: recordId },
      include: {
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
        doctor: {
          include: {
            user: {
              select: {
                name: true
              }
            }
          }
        },
        prescriptions: true
      }
    });

    if (!record) {
      return new NextResponse("Medical Record Not Found", { status: 404 });
    }

    const age = record.patient.dateOfBirth
      ? differenceInYears(new Date(), new Date(record.patient.dateOfBirth))
      : "N/A";

    const dateIssuedStr = new Date(record.date).toLocaleDateString(undefined, {
      month: "long",
      day: "numeric",
      year: "numeric"
    });

    const mockLicenseNumber = `JUMC-LIC-${record.doctor.id.substring(0, 6).toUpperCase()}`;

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Prescription - ${record.patient.user.name}</title>
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
            margin-bottom: 20px;
        }
        .header h1 {
            font-size: 26px;
            font-weight: bold;
            margin: 0 0 5px 0;
            text-transform: uppercase;
        }
        .header h2 {
            font-size: 20px;
            margin: 0;
            letter-spacing: 2px;
            text-transform: uppercase;
            font-weight: 900;
            text-decoration: underline;
        }
        .divider {
            border-top: 2px dashed #000;
            margin: 20px 0;
        }
        .rx-symbol {
            font-size: 44px;
            font-weight: bold;
            margin: 10px 0 20px 0;
            font-family: Georgia, serif;
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
        .prescription-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        .prescription-table th {
            border-bottom: 2px dashed #000;
            border-top: 2px dashed #000;
            padding: 8px;
            font-weight: bold;
            text-align: left;
            text-transform: uppercase;
        }
        .prescription-table td {
            padding: 10px 8px;
            border-bottom: 1px dashed #eee;
        }
        .footer-grid {
            display: grid;
            grid-template-columns: 1.5fr 1fr;
            gap: 40px;
            margin-top: 60px;
        }
        .validity-block {
            font-size: 12px;
            font-style: italic;
        }
        .signature-block {
            text-align: right;
        }
        .signature-line {
            border-bottom: 1px solid #000;
            width: 220px;
            margin-bottom: 8px;
            margin-left: auto;
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
            <button class="btn-print" onclick="window.print()">Print Prescription</button>
        </div>

        <!-- JUMC Clinic Header -->
        <div class="header text-center">
            <h1>Jimma University Medical Center</h1>
            <h2>Prescription</h2>
        </div>

        <div class="text-center rx-symbol">℞</div>

        <div class="divider"></div>

        <!-- Meta Grid Info -->
        <div class="meta-grid">
            <div class="meta-section">
                <h3>Patient Details</h3>
                <p><strong>Name:</strong> ${record.patient.user.name}</p>
                <p><strong>Age:</strong> ${age} Yrs</p>
                <p><strong>Card Number:</strong> ${record.patient.cardNumber || "N/A"}</p>
                <p><strong>Phone:</strong> ${record.patient.user.phone || "N/A"}</p>
            </div>
            <div class="meta-section" style="text-align: right;">
                <h3>Clinical Summary</h3>
                <p><strong>Date Issued:</strong> ${dateIssuedStr}</p>
                <p><strong>Diagnosis:</strong> ${record.diagnosis || "N/A"}</p>
                <p><strong>ICD Code:</strong> ${record.icdCode || "N/A"}</p>
                <p><strong>Prescribed By:</strong> Dr. ${record.doctor.user.name}</p>
            </div>
        </div>

        <!-- Line Items Table -->
        <table class="prescription-table">
            <thead>
                <tr>
                    <th style="width: 40px;">No.</th>
                    <th>Drug Name</th>
                    <th>Dose</th>
                    <th>Frequency</th>
                    <th>Duration</th>
                    <th>Route</th>
                    <th style="width: 50px; text-align: center;">Qty</th>
                    <th>Instructions</th>
                </tr>
            </thead>
            <tbody>
                ${
                  record.prescriptions.length > 0
                    ? record.prescriptions
                        .map(
                          (item, index) => `
                    <tr>
                        <td>${index + 1}</td>
                        <td><strong>${item.drugName}</strong></td>
                        <td>${item.dose}</td>
                        <td>${item.frequency}</td>
                        <td>${item.duration}</td>
                        <td>${item.route}</td>
                        <td style="text-align: center;">${item.quantity || "-"}</td>
                        <td>${item.instructions || "-"}</td>
                    </tr>
                `
                        )
                        .join("")
                    : `
                    <tr>
                        <td colspan="8" style="text-align: center; font-style: italic; color: #777;">No structured drugs prescribed.</td>
                    </tr>
                `
                }
            </tbody>
        </table>

        <div class="divider"></div>

        <!-- Footer Grid -->
        <div class="footer-grid">
            <div class="validity-block">
                <p><strong>* Validity:</strong> This prescription is valid for exactly 30 days from the date of issue.</p>
                <p><strong>Contact:</strong> JUMC OPD Pharmacy — Jimma, Ethiopia</p>
            </div>
            <div class="signature-block">
                <div class="signature-line"></div>
                <p style="margin: 0; font-weight: bold;">Dr. ${record.doctor.user.name}</p>
                <p style="margin: 4px 0 0 0; font-size: 11px; color: #555;">Lic No: ${mockLicenseNumber}</p>
                <p style="margin: 2px 0 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #777;">OPD Prescribing Physician</p>
            </div>
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
    console.error("Prescription Print Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
