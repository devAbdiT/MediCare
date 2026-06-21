// app/api/print/lab/[orderId]/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { format } from "date-fns";

export async function GET(req: Request, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }

    const role = (session.user as any).role as string;
    if (!["DOCTOR", "LABTECH", "ADMIN", "RECEPTIONIST"].includes(role)) {
      return new Response("Forbidden", { status: 403 });
    }

    const { orderId } = await params;

    const order = await prisma.labOrder.findUnique({
      where: { id: orderId },
      include: {
        patient: {
          include: {
            user: true,
          }
        },
        testCatalogue: true,
        result: true,
        doctor: {
          include: {
            user: true,
            department: true
          }
        }
      }
    });

    if (!order || !order.result) {
      return new Response("Lab report not found or not resulted yet.", { status: 404 });
    }

    const patient = order.patient;
    const result = order.result;
    const doctorName = order.doctor?.user?.name || "N/A";
    const doctorDept = order.doctor?.department?.name || "N/A";
    const reportNumber = "LAB-" + order.id.slice(-8).toUpperCase();
    const resultDate = format(result.enteredAt, "MMMM dd, yyyy HH:mm");
    const orderedDate = format(order.orderedAt, "MMM dd, yyyy HH:mm");
    
    // Calculate age (naive)
    const age = patient.dateOfBirth 
      ? Math.floor((new Date().getTime() - new Date(patient.dateOfBirth).getTime()) / 3.15576e+10) 
      : "N/A";

    // Fetch the tech who entered it
    const tech = await prisma.user.findUnique({ where: { id: result.enteredById } });
    const techName = tech?.name || "Lab Technician";

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Lab Report - ${reportNumber}</title>
      <style>
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          color: #1a202c;
          line-height: 1.5;
          margin: 0;
          padding: 40px;
          background: #f7fafc;
        }
        .report-container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          padding: 40px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #2b6cb0;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          margin: 0;
          color: #1e3a8a;
          font-size: 24px;
          font-weight: 800;
          text-transform: uppercase;
        }
        .header h2 {
          margin: 5px 0 0 0;
          color: #4a5568;
          font-size: 16px;
          font-weight: 600;
          letter-spacing: 2px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 30px;
          font-size: 13px;
        }
        .info-box {
          border: 1px solid #e2e8f0;
          padding: 15px;
          border-radius: 4px;
        }
        .info-box h3 {
          margin: 0 0 10px 0;
          font-size: 11px;
          text-transform: uppercase;
          color: #718096;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 5px;
        }
        .info-row {
          display: flex;
          margin-bottom: 4px;
        }
        .info-label {
          font-weight: bold;
          width: 120px;
          color: #4a5568;
        }
        .info-value {
          color: #1a202c;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
          font-size: 13px;
        }
        th, td {
          border: 1px solid #e2e8f0;
          padding: 10px 12px;
          text-align: left;
        }
        th {
          background-color: #f8fafc;
          font-weight: bold;
          color: #4a5568;
          text-transform: uppercase;
          font-size: 11px;
        }
        .result-section {
          margin-bottom: 40px;
        }
        .result-title {
          font-size: 16px;
          font-weight: 800;
          color: #2b6cb0;
          margin-bottom: 10px;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 5px;
        }
        .result-table th { background-color: #ebf8ff; color: #2b6cb0; }
        .result-table td { font-size: 14px; }
        .result-value { font-size: 18px; font-weight: 800; }
        .flag-normal { color: #047857; font-weight: bold; }
        .flag-abnormal { color: #dc2626; font-weight: bold; }
        .interpretation {
          background-color: #f8fafc;
          padding: 15px;
          border-left: 4px solid #cbd5e1;
          font-size: 13px;
          margin-bottom: 30px;
        }
        .footer {
          margin-top: 50px;
          font-size: 11px;
          color: #718096;
          text-align: center;
          border-top: 1px solid #e2e8f0;
          padding-top: 20px;
        }
        .signatures {
          display: flex;
          justify-content: space-between;
          margin-top: 50px;
        }
        .sig-block {
          width: 250px;
          text-align: center;
        }
        .sig-line {
          border-top: 1px solid #cbd5e1;
          margin-bottom: 5px;
        }
        .print-btn {
          display: block;
          width: 200px;
          margin: 0 auto 20px auto;
          padding: 12px;
          background: #1e3a8a;
          color: white;
          text-align: center;
          border-radius: 6px;
          cursor: pointer;
          font-weight: bold;
          border: none;
          font-size: 14px;
        }
        .print-btn:hover { background: #1e40af; }
        @media print {
          body { background: white; padding: 0; }
          .report-container { border: none; box-shadow: none; padding: 0; max-width: 100%; }
          .print-btn { display: none; }
        }
      </style>
    </head>
    <body>
      <button class="print-btn" onclick="window.print()">🖨️ Print Report</button>
      
      <div class="report-container">
        <div class="header">
          <h1>Jimma University Medical Center</h1>
          <h2>Laboratory Report</h2>
        </div>

        <div class="info-grid">
          <div class="info-box">
            <h3>Patient Information</h3>
            <div class="info-row"><div class="info-label">Name:</div><div class="info-value">${patient.user.name}</div></div>
            <div class="info-row"><div class="info-label">Card Number:</div><div class="info-value">${patient.cardNumber || 'N/A'}</div></div>
            <div class="info-row"><div class="info-label">Age / Gender:</div><div class="info-value">${age} / ${patient.user.gender || 'N/A'}</div></div>
            <div class="info-row"><div class="info-label">Blood Type:</div><div class="info-value">${patient.bloodType || 'N/A'}</div></div>
          </div>
          <div class="info-box">
            <h3>Order Information</h3>
            <div class="info-row"><div class="info-label">Report #:</div><div class="info-value">${reportNumber}</div></div>
            <div class="info-row"><div class="info-label">Referring Dr:</div><div class="info-value">Dr. ${doctorName}</div></div>
            <div class="info-row"><div class="info-label">Department:</div><div class="info-value">${doctorDept}</div></div>
            <div class="info-row"><div class="info-label">Result Date:</div><div class="info-value">${resultDate}</div></div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Test Name</th>
              <th>Code</th>
              <th>Sample Type</th>
              <th>Ordered</th>
              <th>Resulted</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>${order.testName}</strong></td>
              <td>${order.testCatalogue?.code || 'N/A'}</td>
              <td>${order.sampleType || 'Not specified'}</td>
              <td>${orderedDate}</td>
              <td>${resultDate}</td>
            </tr>
          </tbody>
        </table>

        <div class="result-section">
          <div class="result-title">Test Results</div>
          <table class="result-table">
            <thead>
              <tr>
                <th>Parameter</th>
                <th>Result</th>
                <th>Unit</th>
                <th>Reference Range</th>
                <th>Flag</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${order.testName}</td>
                <td class="result-value ${result.isAbnormal ? 'flag-abnormal' : ''}">${result.resultValue}</td>
                <td>${result.unit || ''}</td>
                <td>${result.referenceRange || ''}</td>
                <td class="${result.isAbnormal ? 'flag-abnormal' : 'flag-normal'}">
                  ${result.isAbnormal ? 'ABNORMAL' : 'Normal'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        ${result.interpretation ? `
        <div class="interpretation">
          <strong>Clinical Interpretation:</strong><br/>
          ${result.interpretation}
        </div>
        ` : ''}

        <div class="signatures">
          <div class="sig-block">
            <div class="sig-line"></div>
            <div><strong>${techName}</strong></div>
            <div style="font-size: 10px; color: #718096;">Testing Laboratory</div>
          </div>
          <div class="sig-block">
            <div class="sig-line"></div>
            <div><strong>Dr. ${doctorName}</strong></div>
            <div style="font-size: 10px; color: #718096;">Referring Physician</div>
          </div>
        </div>

        <div class="footer">
          <p>This report was generated electronically by the MediCare Laboratory Information System.</p>
          <p>CONFIDENTIALITY NOTICE: This document contains confidential medical information. If you are not the intended recipient, please destroy immediately.</p>
        </div>
      </div>
    </body>
    </html>
    `;

    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (error) {
    console.error("Print Lab Report Error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
