import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { startOfDay, endOfDay, subDays, eachDayOfInterval, format } from "date-fns";

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");
    const departmentId = searchParams.get("departmentId");

    const endDate = toParam ? endOfDay(new Date(toParam)) : endOfDay(new Date());
    const startDate = fromParam ? startOfDay(new Date(fromParam)) : startOfDay(subDays(endDate, 30));

    // Build where clause
    const where: any = {
      dateTime: { gte: startDate, lte: endDate },
    };

    if (departmentId) {
      where.doctor = { departmentId };
    }

    const appointments = await prisma.appointment.findMany({
      where,
      select: { id: true, status: true, dateTime: true },
    });

    const total = appointments.length;
    const byStatus: Record<string, number> = {
      SCHEDULED: 0,
      CHECKED_IN: 0,
      COMPLETED: 0,
      CANCELLED: 0,
      NO_SHOW: 0,
      RESCHEDULED: 0,
    };

    for (const appt of appointments) {
      const s = appt.status as string;
      if (s in byStatus) byStatus[s]++;
    }

    const completionRate = total > 0
      ? parseFloat(((byStatus.COMPLETED / total) * 100).toFixed(1))
      : 0;
    const noShowRate = total > 0
      ? parseFloat(((byStatus.NO_SHOW / total) * 100).toFixed(1))
      : 0;

    // Daily breakdown
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const dailyBreakdown = days.map((day) => {
      const dayStr = format(day, "yyyy-MM-dd");
      const dayAppts = appointments.filter(
        (a) => format(new Date(a.dateTime), "yyyy-MM-dd") === dayStr
      );
      return {
        date: format(day, "MMM dd"),
        completed: dayAppts.filter((a) => a.status === "COMPLETED").length,
        cancelled: dayAppts.filter((a) => a.status === "CANCELLED").length,
        noShow: dayAppts.filter((a) => a.status === "NO_SHOW").length,
        scheduled: dayAppts.filter((a) => a.status === "SCHEDULED").length,
      };
    });

    return NextResponse.json({
      total,
      byStatus,
      completionRate,
      noShowRate,
      dailyBreakdown,
    });
  } catch (error) {
    console.error("GET Appointments Report Error:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
