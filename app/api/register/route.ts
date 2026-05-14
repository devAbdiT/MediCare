// app/api/register/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hash } from "bcrypt-ts";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, password, dateOfBirth, bloodType, gender } = body;

    // Validate required fields
    if (!name || !email || !password || !dateOfBirth || !bloodType || !gender) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return new NextResponse("User with this email already exists", { status: 400 });
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Generate card number
    const year = new Date().getFullYear();
    const patientCount = await prisma.patient.count();
    const sequence = String(patientCount + 1).padStart(4, "0");
    const cardNumber = `BK-P-${year}-${sequence}`;

    // Create user, patient, and account in transaction
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
              dateOfBirth: new Date(dateOfBirth),
              bloodType,
              cardNumber
            }
          },
          accounts: {
            create: {
              accountId: email,
              providerId: "credential",
              password: hashedPassword
            }
          }
        },
        include: {
          patient: true
        }
      });

      return newUser;
    });

    return NextResponse.json({
      message: "Registration successful",
      user: {
        id: result.id,
        name: result.name,
        email: result.email,
        cardNumber: result.patient?.cardNumber
      }
    });
  } catch (error: any) {
    console.error("Registration Error:", error);
    
    if (error.code === "P2002") {
      return new NextResponse("Email already exists", { status: 400 });
    }
    
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
