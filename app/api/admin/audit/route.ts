import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { format } from "date-fns";

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session || (session.user as any).role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Fetch all users and appointments to build a basic audit trail
  const [users, appointments] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" }
    }),
    prisma.appointment.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true } }
      }
    })
  ]);

  // Combine into a structured log format
  const auditLogs = [
    ...users.map(u => ({
      Timestamp: format(u.createdAt, "yyyy-MM-dd HH:mm:ss"),
      EventType: "USER_REGISTRATION",
      Actor: "SYSTEM",
      Target: u.email,
      Details: `Registered new ${u.role}: ${u.name}`
    })),
    ...appointments.map(a => ({
      Timestamp: format(a.createdAt, "yyyy-MM-dd HH:mm:ss"),
      EventType: "APPOINTMENT_BOOKED",
      Actor: "SYSTEM",
      Target: `Appt ID: ${a.id.slice(-6)}`,
      Details: `Patient ${a.patient?.user?.name} booked with Dr. ${a.doctor?.user?.name} for ${format(a.dateTime, "yyyy-MM-dd HH:mm")}`
    }))
  ];

  // Sort chronologically (oldest to newest for a log, or newest to oldest)
  auditLogs.sort((a, b) => new Date(b.Timestamp).getTime() - new Date(a.Timestamp).getTime());

  // Generate CSV String
  const csvHeaders = ["Timestamp", "EventType", "Actor", "Target", "Details"];
  const csvRows = auditLogs.map(log => 
    [log.Timestamp, log.EventType, log.Actor, log.Target, `"${log.Details}"`].join(",")
  );
  const csvContent = [csvHeaders.join(","), ...csvRows].join("\n");

  return new NextResponse(csvContent, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="system_audit_${format(new Date(), "yyyy-MM-dd")}.csv"`
    }
  });
}
