import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { emailVerified: true },
    });

    return NextResponse.json({ message: "Email verified successfully", user });
  } catch (error) {
    console.error("Admin verify email error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
