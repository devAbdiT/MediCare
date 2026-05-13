import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        patient: {
          include: {
            medicalRecords: {
              include: {
                doctor: {
                  include: {
                    user: true
                  }
                }
              },
              orderBy: { date: "desc" }
            }
          }
        },
        doctor: true,
        receptionist: true,
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Format data for printing according to requested schema
    const printData = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt,
      dateOfBirth: user.patient?.dateOfBirth,
      bloodType: user.patient?.bloodType,
      cardNumber: user.patient?.cardNumber,
      specialization: user.doctor?.specialization,
      appointments: user.patient?.medicalRecords.map((record: any) => ({
        id: record.id,
        dateTime: record.date,
        doctorName: record.doctor.user.name,
        status: "Completed" // Records are completed visits
      })) || []
    };

    return NextResponse.json(printData);
  } catch (error) {
    console.error("Print API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user data" },
      { status: 500 }
    );
  }
}
