// app/api/admin/users/route.ts
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { hash } from "bcrypt-ts";

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  // Security: Only Admins can create staff/patients via this route
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { name, email, password, role, phone, specialization, dateOfBirth, gender, bloodType } = await req.json();

  if (!name || !email || !password || !role) {
    return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
  }

  try {
    const hashedPassword = await hash(password, 10);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the User
      const user = await tx.user.create({
        data: {
          name,
          email,
          role,
          phone,
          password: hashedPassword,
        },
      });

      // 2. Create the Account (for better-auth)
      await tx.account.create({
        data: {
          userId: user.id,
          accountId: user.id,
          providerId: "credential",
          password: hashedPassword,
        },
      });

      // 3. Role-specific records
      if (role === "DOCTOR") {
        await tx.doctor.create({
          data: {
            userId: user.id,
            specialization: specialization || "General Medicine",
          }
        });
      } else if (role === "PATIENT") {
        // Auto-generate a unique card number: BK-P-YYYY-NNNN
        const year = new Date().getFullYear();
        const patientCount = await tx.patient.count();
        const sequence = String(patientCount + 1).padStart(4, "0");
        const cardNumber = `BK-P-${year}-${sequence}`;

        await tx.patient.create({
          data: {
            userId: user.id,
            dateOfBirth: new Date(dateOfBirth || "2000-01-01"),
            gender: gender || "OTHER",
            bloodType: bloodType || "UNKNOWN",
            cardNumber,
          }
        });
      }

      return user;
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("User Creation Error:", err);
    if (err.code === "P2002") {
      return NextResponse.json({ message: "Email already exists" }, { status: 400 });
    }
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
