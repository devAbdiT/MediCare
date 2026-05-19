// app/api/admin/users/[id]/details/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        patient: {
          select: {
            id: true,
            dateOfBirth: true,
            bloodType: true,
            cardNumber: true,
            medicalRecords: {
              orderBy: { date: "desc" },
              take: 5,
              select: {
                id: true,
                date: true,
                diagnosis: true,
                prescription: true,
                doctor: { select: { user: { select: { name: true } } } },
              },
            },
            appointments: {
              orderBy: { dateTime: "desc" },
              take: 5,
              select: {
                id: true,
                dateTime: true,
                status: true,
                reason: true,
                doctor: { select: { user: { select: { name: true } } } },
              },
            },
          },
        },
        doctor: {
          select: {
            id: true,
            specialization: true,
            department: { select: { name: true } },
            appointments: {
              orderBy: { dateTime: "desc" },
              take: 5,
              select: {
                id: true,
                dateTime: true,
                status: true,
                reason: true,
                patient: { select: { user: { select: { name: true } } } },
              },
            },
            _count: {
              select: {
                appointments: true,
                medicalRecords: true,
              },
            },
          },
        },
        receptionist: {
          select: {
            id: true,
            appointments: {
              orderBy: { dateTime: "desc" },
              take: 5,
              select: {
                id: true,
                dateTime: true,
                status: true,
                reason: true,
                patient: { select: { user: { select: { name: true } } } },
                doctor: { select: { user: { select: { name: true } } } },
              },
            },
            _count: { select: { appointments: true } },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("User details fetch error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
