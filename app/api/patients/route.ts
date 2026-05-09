// app/api/patients/route.ts
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { hash } from "bcrypt-ts";

// GET /api/patients - Get all patients (Admin/Receptionist only)
export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "RECEPTIONIST")) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const patients = await prisma.patient.findMany({
    include: {
      user: {
        select: {
          name: true,
          email: true,
          phone: true,
          createdAt: true,
        }
      }
    },
    orderBy: {
      user: {
        createdAt: "desc"
      }
    }
  });

  return NextResponse.json(patients);
}

// POST /api/patients - Register a new patient
export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  // Only Admin and Receptionist can register patients
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "RECEPTIONIST")) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, email, phone, dateOfBirth, bloodType, password } = body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return new NextResponse("User with this email already exists", { status: 400 });
    }

    const hashedPassword = await hash(password || "patient123", 10);

    // Create User, Patient, and Better Auth Account in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          phone,
          password: hashedPassword,
          role: "PATIENT",
          patient: {
            create: {
              dateOfBirth: new Date(dateOfBirth),
              bloodType,
            }
          },
          accounts: {
            create: {
              accountId: email,
              providerId: "credential",
              password: hashedPassword,
            }
          }
        },
        include: {
          patient: true
        }
      });

      return newUser;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Patient Registration Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
