// app/api/register/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hash } from "bcrypt-ts";
import { differenceInYears } from "date-fns";
import { formatPhoneNumber } from "@/lib/phone-format";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, password, dateOfBirth, age, bloodType, gender } = body;

    // Validate required fields (bloodType & dateOfBirth are now optional)
    if (!name || !email || !password || !gender) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Validate and format phone number
    let formattedPhone: string | undefined;
    if (phone) {
      try {
        formattedPhone = formatPhoneNumber(phone);
      } catch {
        return new NextResponse(
          "Invalid phone number. Use format: +251912345678, +251712345678, 0912345678, or 0712345678",
          { status: 400 }
        );
      }
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

    // Compute age from DOB if age not explicitly provided
    let resolvedAge: number | undefined = undefined;
    let resolvedDOB: Date | undefined = undefined;

    if (dateOfBirth) {
      resolvedDOB = new Date(dateOfBirth);
      resolvedAge = age !== undefined && age !== "" ? Number(age) : differenceInYears(new Date(), resolvedDOB);
    } else if (age !== undefined && age !== "") {
      resolvedAge = Number(age);
      // Estimate DOB from age (Jan 1 of birth year) so profile still has a rough DOB
      const birthYear = new Date().getFullYear() - resolvedAge;
      resolvedDOB = new Date(`${birthYear}-01-01`);
    }

    // Create user, patient, and account in transaction
    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          phone: formattedPhone,
          password: hashedPassword,
          role: "PATIENT",
          gender,
          patient: {
            create: {
              ...(resolvedDOB ? { dateOfBirth: resolvedDOB } : {}),
              ...(resolvedAge !== undefined ? { age: resolvedAge } : {}),
              ...(bloodType ? { bloodType } : {}),
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
