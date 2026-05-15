import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { startOfDay, endOfDay } from "date-fns";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get("date");

    if (!dateStr) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    const date = new Date(dateStr);
    const start = startOfDay(date);
    const end = endOfDay(date);

    // Fetch all doctors with their user info and specialization
    const doctors = await prisma.doctor.findMany({
      include: {
        user: {
          select: {
            name: true,
          },
        },
        department: {
          select: {
            name: true,
          },
        },
      },
    });

    // Fetch appointments for the given date
    const appointments = await prisma.appointment.groupBy({
      by: ["doctorId"],
      where: {
        dateTime: {
          gte: start,
          lte: end,
        },
        status: {
          in: ["SCHEDULED", "COMPLETED"], // Only count active appointments
        },
      },
      _count: {
        id: true,
      },
    });

    // Fetch weekly appointments for context (optional but requested in requirements)
    const weekStart = new Date(start);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6); // End of week
    
    const weeklyAppointments = await prisma.appointment.groupBy({
      by: ["doctorId"],
      where: {
        dateTime: {
          gte: weekStart,
          lte: weekEnd,
        },
        status: {
          in: ["SCHEDULED", "COMPLETED"],
        },
      },
      _count: {
        id: true,
      },
    });

    const appointmentCounts = appointments.reduce((acc, curr) => {
      acc[curr.doctorId] = curr._count.id;
      return acc;
    }, {} as Record<string, number>);

    const weeklyCounts = weeklyAppointments.reduce((acc, curr) => {
      acc[curr.doctorId] = curr._count.id;
      return acc;
    }, {} as Record<string, number>);

    const getWorkloadLevel = (count: number) => {
      if (count <= 3) return "LOW";
      if (count <= 6) return "MEDIUM";
      if (count <= 9) return "HIGH";
      return "FULL";
    };

    const workloadData = doctors.map((doctor) => {
      const todayCount = appointmentCounts[doctor.id] || 0;
      const weeklyCount = weeklyCounts[doctor.id] || 0;
      const workloadLevel = getWorkloadLevel(todayCount);

      return {
        doctorId: doctor.id,
        name: doctor.user.name,
        specialization: doctor.department?.name || doctor.specialization,
        appointmentCount: todayCount,
        weeklyCount: weeklyCount,
        workloadLevel,
        available: workloadLevel !== "FULL",
      };
    });

    return NextResponse.json(workloadData);
  } catch (error) {
    console.error("Error fetching doctor workload:", error);
    return NextResponse.json(
      { error: "Failed to fetch doctor workload" },
      { status: 500 }
    );
  }
}
