import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    
    const department = await prisma.department.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description
      }
    });
    return NextResponse.json(department);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update department" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const department = await prisma.department.findUnique({
      where: { id },
      include: { _count: { select: { doctors: true } } }
    });

    if (department && department._count.doctors > 0) {
      return NextResponse.json({ error: "Cannot delete department with assigned doctors. Reassign them first." }, { status: 400 });
    }

    await prisma.department.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete department" }, { status: 500 });
  }
}
