import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { startOfDay, endOfDay, subDays } from "date-fns";

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    const endDate = toParam ? endOfDay(new Date(toParam)) : endOfDay(new Date());
    const startDate = fromParam
      ? startOfDay(new Date(fromParam))
      : startOfDay(subDays(endDate, 30));

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

    // Gather all appointment IDs per department for revenue lookups
    const result = await Promise.all(
      departments.map(async (dept) => {
        let appointmentCount = 0;
        let completedCount = 0;
        let cancelledCount = 0;
        let noShowCount = 0;
        let topDoctor = { name: "—", appointmentCount: 0 };

        for (const doc of dept.doctors) {
          const docAppts = doc.appointments;
          appointmentCount += docAppts.length;
          completedCount += docAppts.filter((a) => a.status === "COMPLETED").length;
          cancelledCount += docAppts.filter((a) => a.status === "CANCELLED").length;
          noShowCount += docAppts.filter((a) => a.status === "NO_SHOW").length;

          if (docAppts.length > topDoctor.appointmentCount) {
            topDoctor = {
              name: doc.user.name,
              appointmentCount: docAppts.length,
            };
          }
        }

        // Revenue = sum of paidAmount on invoices for appointments in this dept
        const allApptIds = dept.doctors.flatMap((d) =>
          d.appointments.map((a) => a.id)
        );

        let revenue = 0;
        if (allApptIds.length > 0) {
          const invoices = await prisma.invoice.findMany({
            where: { appointmentId: { in: allApptIds } },
            select: { paidAmount: true },
          });
          revenue = invoices.reduce((sum, inv) => sum + Number(inv.paidAmount), 0);
        }

        return {
          id: dept.id,
          name: dept.name,
          appointmentCount,
          completedCount,
          cancelledCount,
          noShowCount,
          revenue,
          topDoctor,
        };
      })
    );

    // Sort by appointment count descending
    result.sort((a, b) => b.appointmentCount - a.appointmentCount);

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET Departments Report Error:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
