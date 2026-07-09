// app/api/patients/route.ts
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { hash } from "bcrypt-ts";
import { createAuditLog } from "@/lib/audit";

// GET /api/patients - Get all patients (Admin/Receptionist only)
export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session || ((session.user as any).role !== "ADMIN" && (session.user as any).role !== "RECEPTIONIST")) {
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
  if (!session || ((session.user as any).role !== "ADMIN" && (session.user as any).role !== "RECEPTIONIST")) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, email, phone, dateOfBirth, age, gender, bloodType, password } = body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return new NextResponse("User with this email already exists", { status: 400 });
    }

    const hashedPassword = await hash(password || "patient123", 10);

    // Generate unique card number
    const year = new Date().getFullYear();
    const patientCount = await prisma.patient.count();
    const cardNumber = `BK-P-${year}-${String(patientCount + 1).padStart(4, "0")}`;

    // Resolve DOB and age
    const resolvedDOB = dateOfBirth ? new Date(dateOfBirth) : undefined;
    const resolvedAge = age ? Number(age) : undefined;

    // Create User, Patient, and Better Auth Account in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          phone,
          password: hashedPassword,
          role: "PATIENT",
          gender,
          patient: {
            create: {
              ...(resolvedDOB ? { dateOfBirth: resolvedDOB } : {}),
              ...(resolvedAge !== undefined ? { age: resolvedAge } : {}),
              ...(bloodType ? { bloodType } : {}),
              cardNumber,
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

    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "127.0.0.1";
    await createAuditLog({
      userId: session.user.id,
      userRole: (session.user as any).role,
      action: "CREATE",
      entity: "Patient",
      entityId: result.patient?.id,
      newValues: { name: result.name, cardNumber: result.patient?.cardNumber },
      ipAddress,
    });

    return NextResponse.json({
      id: result.id,
      name: result.name,
      email: result.email,
      phone: result.phone,
      cardNumber: result.patient?.cardNumber,
      dateOfBirth: result.patient?.dateOfBirth,
      age: result.patient?.age,
      bloodType: result.patient?.bloodType,
      registeredDate: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    });
  } catch (error) {
    console.error("Patient Registration Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

