// app/api/admin/users/[id]/route.ts
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  // Security: Only Admins can delete users
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Prevent admin from deleting themselves
    if (id === session.user.id) {
      return NextResponse.json({ message: "Cannot delete your own admin account" }, { status: 400 });
    }

    // Prisma will handle cascaded deletes if configured, 
    // but better-auth tables might need manual cleanup if not linked via FKs.
    // Our schema has FKs, so deleting the user should clean up Patient/Doctor/Account.
    await prisma.user.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("User Deletion Error:", err);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
