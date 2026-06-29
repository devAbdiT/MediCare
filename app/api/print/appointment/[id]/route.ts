import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { format } from "date-fns";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  if (!id) {
    return new NextResponse("Appointment ID is required", { status: 400 });
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: {
      patient: {
        include: {
          user: { select: { name: true, phone: true, email: true } },
        }
      },
      doctor: {
        include: {
          user: { select: { name: true } },
          department: true
        }
      }
    }
  });

  if (!appointment) {
    return new NextResponse("Appointment not found", { status: 404 });
  }

  // Get system settings for clinic info (fallback to defaults if missing)
  const settingsDoc = await prisma.systemSettings.findFirst();
  const settingsData = (settingsDoc?.data as any) || {};
  const clinicName = settingsData.clinicName || "MediCare Clinic";
  const address = settingsData.address || "123 Health Ave, Medical District";
  const phone = settingsData.phone || "+1 (555) 123-4567";

  const apptIdCode = "APPT-" + appointment.id.slice(-8).toUpperCase();
  const dateStr = format(new Date(appointment.dateTime), "MMMM dd, yyyy");
  const timeStr = format(new Date(appointment.dateTime), "h:mm a");

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Appointment Slip - ${apptIdCode}</title>
      <style>
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          color: #1A2A4A;
          line-height: 1.6;
          margin: 0;
          padding: 40px;
          background-color: #f9fafb;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: #ffffff;
          padding: 40px;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          border: 1px solid #e2e8f0;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #1E4A8A;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .clinic-name {
          font-size: 24px;
          font-weight: 900;
          color: #1E4A8A;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .title {
          font-size: 18px;
          font-weight: 700;
          color: #475569;
          margin: 10px 0 0 0;
        }
        .appt-id {
          font-size: 14px;
          color: #64748b;
          margin-top: 5px;
          font-family: monospace;
          background: #f1f5f9;
          padding: 4px 8px;
          border-radius: 4px;
          display: inline-block;
        }
        .section {
          margin-bottom: 25px;
        }
        .section-title {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: #94a3b8;
          font-weight: 800;
          margin-bottom: 10px;
          border-bottom: 1px solid #f1f5f9;
          padding-bottom: 5px;
        }
        .row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .label {
          font-weight: 600;
          color: #64748b;
        }
        .value {
          font-weight: 700;
          color: #1e293b;
          text-align: right;
        }
        .badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .badge.SCHEDULED { background: #eff6ff; color: #2563eb; }
        .badge.CHECKED_IN { background: #ecfdf5; color: #059669; }
        .badge.COMPLETED { background: #f8fafc; color: #475569; }
        .badge.CANCELLED { background: #fef2f2; color: #dc2626; }
        .badge.NO_SHOW { background: #fffbeb; color: #d97706; }
        .badge.PAID { background: #ecfdf5; color: #059669; }
        .badge.PENDING { background: #fffbeb; color: #d97706; }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px dashed #cbd5e1;
          text-align: center;
          font-size: 12px;
          color: #64748b;
        }
        .instructions {
          background: #f8fafc;
          padding: 15px;
          border-radius: 8px;
          margin-top: 20px;
          font-size: 13px;
          font-weight: 600;
          color: #334155;
          text-align: center;
          border: 1px solid #e2e8f0;
        }
        .print-btn {
          display: block;
          width: 100%;
          padding: 15px;
          background: #1E4A8A;
          color: white;
          text-align: center;
          text-decoration: none;
          font-weight: bold;
          border-radius: 8px;
          margin-top: 20px;
          cursor: pointer;
          border: none;
          font-size: 16px;
        }
        .print-btn:hover {
          background: #1e3a8a;
        }
        @media print {
          body {
            background-color: white;
            padding: 0;
          }
          .container {
            box-shadow: none;
            border: none;
            padding: 0;
          }
          .print-btn {
            display: none !important;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 class="clinic-name">${clinicName}</h1>
          <h2 class="title">Appointment Confirmation Slip</h2>
          <div class="appt-id">${apptIdCode}</div>
        </div>

        <div class="section">
          <div class="section-title">Patient Details</div>
          <div class="row">
            <span class="label">Full Name:</span>
            <span class="value">${appointment.patient?.user?.name || 'N/A'}</span>
          </div>
          <div class="row">
            <span class="label">Card Number:</span>
            <span class="value">${appointment.patient?.cardNumber || 'N/A'}</span>
          </div>
          <div class="row">
            <span class="label">Phone:</span>
            <span class="value">${appointment.patient?.user?.phone || 'N/A'}</span>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Appointment Details</div>
          <div class="row">
            <span class="label">Doctor:</span>
            <span class="value">Dr. ${appointment.doctor?.user?.name || 'N/A'}</span>
          </div>
          <div class="row">
            <span class="label">Specialization:</span>
            <span class="value">${appointment.doctor?.specialization || appointment.doctor?.department?.name || 'General'}</span>
          </div>
          <div class="row">
            <span class="label">Date:</span>
            <span class="value">${dateStr}</span>
          </div>
          <div class="row">
            <span class="label">Time:</span>
            <span class="value">${timeStr}</span>
          </div>
          <div class="row">
            <span class="label">Visit Type:</span>
            <span class="value">${appointment.appointmentType.replace('_', ' ')}</span>
          </div>
          <div class="row">
            <span class="label">Priority:</span>
            <span class="value">${appointment.priority}</span>
          </div>
          ${appointment.chiefComplaint ? `
            <div class="row">
              <span class="label">Chief Complaint:</span>
              <span class="value">${appointment.chiefComplaint}</span>
            </div>
          ` : ''}
        </div>

        <div class="section">
          <div class="section-title">Status</div>
          <div class="row">
            <span class="label">Appointment Status:</span>
            <span class="value"><span class="badge ${appointment.status}">${appointment.status.replace('_', ' ')}</span></span>
          </div>
          ${(appointment as any).paymentRequired ? `
            <div class="row">
              <span class="label">Payment Status:</span>
              <span class="value"><span class="badge ${(appointment as any).paymentStatus}">${(appointment as any).paymentStatus}</span></span>
            </div>
          ` : ''}
        </div>

        <div class="instructions">
          Please arrive 15 minutes before your appointment time.
        </div>

        <button class="print-btn" onclick="window.print()">Print Slip</button>

        <div class="footer">
          ${clinicName}<br>
          ${address}<br>
          ${phone}
        </div>
      </div>
    </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html",
    },
  });
}
