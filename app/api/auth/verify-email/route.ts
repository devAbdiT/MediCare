// app/api/auth/verify-email/route.ts
// Handles the link the user clicks from their inbox.
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  if (!token || !email) {
    return NextResponse.redirect(new URL("/verify-email?error=invalid", req.url));
  }

  // Find matching verification record
  const record = await prisma.verification.findFirst({
    where: { identifier: email, value: token },
  });

  if (!record) {
    return NextResponse.redirect(
      new URL(`/verify-email?email=${encodeURIComponent(email)}&error=invalid`, req.url)
    );
  }

  if (record.expiresAt < new Date()) {
    await prisma.verification.delete({ where: { id: record.id } });
    return NextResponse.redirect(
      new URL(`/verify-email?email=${encodeURIComponent(email)}&error=expired`, req.url)
    );
  }

  // Mark the user as verified and clean up the token
  await prisma.$transaction([
    prisma.user.update({
      where: { email },
      data: { emailVerified: true },
    }),
    prisma.verification.delete({ where: { id: record.id } }),
  ]);

  // Redirect to login with a success hint
  return NextResponse.redirect(new URL("/login?verified=1", req.url));
}
