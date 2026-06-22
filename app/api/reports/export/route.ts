import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { startOfDay, endOfDay, subDays, eachDayOfInterval, format } from "date-fns";
import prisma from "@/lib/prisma";

function escapeCSV(val: any): string {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCSV(headers: string[], rows: string[][]): string {
  const lines = [headers.map(escapeCSV).join(",")];
  for (const row of rows) {
    lines.push(row.map(escapeCSV).join(","));
  }
  return lines.join("\r\n");
}

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "revenue";
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    const endDate = toParam ? endOfDay(new Date(toParam)) : endOfDay(new Date());
    const startDate = fromParam
      ? startOfDay(new Date(fromParam))
      : startOfDay(subDays(endDate, 30));

    const dateLabel = `${format(startDate, "yyyy-MM-dd")}_to_${format(endDate, "yyyy-MM-dd")}`;
    let csv = "";
    let filename = "";

    // ─── REVENUE CSV ────────────────────────────────────────────────
    if (type === "revenue") {
      filename = `revenue_report_${dateLabel}.csv`;

      const invoices = await prisma.invoice.findMany({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          status: { notIn: ["CANCELLED", "WAIVED"] as any },
        },
        include: {
          patient: { include: { user: { select: { name: true } } } },
          payments: true,
          lineItems: { include: { service: true } },
        },
        orderBy: { createdAt: "asc" },
      });

      const csvHeaders = [
        "Invoice Number",
        "Date",
        "Patient Name",
        "Total Amount (ETB)",
        "Paid Amount (ETB)",
        "Outstanding (ETB)",
        "Status",
        "Payment Method(s)",
        "Services",
      ];

      const rows: string[][] = invoices.map((inv) => {
        const methods = [...new Set(inv.payments.map((p) => p.method))].join("; ");
        const services = inv.lineItems.map((li) => li.description).join("; ");
        const outstanding = Number(inv.totalAmount) - Number(inv.paidAmount);
        return [
          inv.invoiceNumber,
          format(new Date(inv.createdAt), "yyyy-MM-dd"),
          inv.patient.user.name,
          String(Number(inv.totalAmount).toFixed(2)),
          String(Number(inv.paidAmount).toFixed(2)),
          String(outstanding.toFixed(2)),
          inv.status,
          methods,
          services,
        ];
      });

      csv = buildCSV(csvHeaders, rows);
    }

    // ─── APPOINTMENTS CSV ────────────────────────────────────────────
    else if (type === "appointments") {
      filename = `appointments_report_${dateLabel}.csv`;

      const appointments = await prisma.appointment.findMany({
        where: { dateTime: { gte: startDate, lte: endDate } },
        include: {
          patient: { include: { user: { select: { name: true } } } },
          doctor: {
            include: {
              user: { select: { name: true } },
              department: { select: { name: true } },
            },
          },
        },
        orderBy: { dateTime: "asc" },
      });

      const csvHeaders = [
        "Date",
        "Time",
        "Patient Name",
        "Doctor Name",
        "Department",
        "Status",
        "Reason",
        "Walk-In",
      ];

      const rows: string[][] = appointments.map((a) => [
        format(new Date(a.dateTime), "yyyy-MM-dd"),
        format(new Date(a.dateTime), "HH:mm"),
        a.patient.user.name,
        a.doctor.user.name,
        a.doctor.department?.name || "—",
        a.status,
        a.reason || "—",
        a.walkIn ? "Yes" : "No",
      ]);

      csv = buildCSV(csvHeaders, rows);
    }

    // ─── DEPARTMENTS CSV ─────────────────────────────────────────────
    else if (type === "departments") {
      filename = `departments_report_${dateLabel}.csv`;

      const departments = await prisma.department.findMany({
        include: {
          doctors: {
            include: {
              user: { select: { name: true } },
              appointments: {
                where: { dateTime: { gte: startDate, lte: endDate } },
                select: { id: true, status: true },
              },
            },
          },
        },
      });

      const csvHeaders = [
        "Department",
        "Total Appointments",
        "Completed",
        "Cancelled",
        "No-Show",
        "Completion Rate (%)",
        "Revenue Collected (ETB)",
        "Top Doctor",
        "Top Doctor Appointments",
      ];

      const rows: string[][] = await Promise.all(
        departments.map(async (dept) => {
          let total = 0, completed = 0, cancelled = 0, noShow = 0;
          let topDoc = { name: "—", count: 0 };

          for (const doc of dept.doctors) {
            total += doc.appointments.length;
            completed += doc.appointments.filter((a) => a.status === "COMPLETED").length;
            cancelled += doc.appointments.filter((a) => a.status === "CANCELLED").length;
            noShow += doc.appointments.filter((a) => a.status === "NO_SHOW").length;
            if (doc.appointments.length > topDoc.count) {
              topDoc = { name: doc.user.name, count: doc.appointments.length };
            }
          }

          const apptIds = dept.doctors.flatMap((d) => d.appointments.map((a) => a.id));
          let revenue = 0;
          if (apptIds.length > 0) {
            const invs = await prisma.invoice.findMany({
              where: { appointmentId: { in: apptIds } },
              select: { paidAmount: true },
            });
            revenue = invs.reduce((sum, inv) => sum + Number(inv.paidAmount), 0);
          }

          const completionRate = total > 0 ? ((completed / total) * 100).toFixed(1) : "0.0";

          return [
            dept.name,
            String(total),
            String(completed),
            String(cancelled),
            String(noShow),
            completionRate,
            revenue.toFixed(2),
            topDoc.name,
            String(topDoc.count),
          ];
        })
      );

      csv = buildCSV(csvHeaders, rows);
    } else {
      return NextResponse.json({ error: "Invalid type parameter" }, { status: 400 });
    }

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("CSV Export Error:", error);
    return NextResponse.json({ error: "Failed to export report" }, { status: 500 });
  }
}
