// app/api/user/profile/route.ts
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { hash } from "bcrypt-ts";
import { formatPhoneNumber } from "@/lib/phone-format";

export async function PATCH(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { phone, password } = await req.json();

  // Validate and format phone number
  let formattedPhone: string | undefined;
  if (phone) {
    try {
      formattedPhone = formatPhoneNumber(phone);
    } catch {
      return NextResponse.json(
        { message: "Invalid phone number. Use format: +251912345678, +251712345678, 0912345678, or 0712345678" },
        { status: 400 }
      );
    }
  }

  try {
    const hashedPassword = password ? await hash(password, 10) : null;

    const result = await prisma.$transaction(async (tx) => {
      // Update User
      const updatedUser = await tx.user.update({
        where: { id: session.user.id },
        data: {
          phone: formattedPhone || undefined,
          ...(hashedPassword ? { password: hashedPassword } : {}),
        },
      });

      // Sync password to Account table for Better Auth
      if (hashedPassword) {
        await tx.account.updateMany({
          where: { 
            userId: session.user.id,
            providerId: "credential" 
          },
          data: { password: hashedPassword },
        });
      }

      return updatedUser;
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("Profile Update Error:", err);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
