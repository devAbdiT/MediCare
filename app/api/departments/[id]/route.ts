// app/api/departments/[id]/route.ts
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

// GET /api/departments/[id] - Get single department
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { id } = await params;

    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        doctors: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!department) {
      return new NextResponse("Department not found", { status: 404 });
    }

    return NextResponse.json(department);
  } catch (error) {
    console.error("Fetch Department Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// PATCH /api/departments/[id] - Update department
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  // Only Admin can update departments
  if (!session || (session.user as any).role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { name, description } = body;

    const department = await prisma.department.update({
      where: { id },
      data: {
        name: name || undefined,
        description: description !== undefined ? description : undefined
      }
    });

    return NextResponse.json(department);
  } catch (error: any) {
    console.error("Update Department Error:", error);
    
    if (error.code === "P2002") {
      return new NextResponse("Department name must be unique", { status: 400 });
    }
    
    if (error.code === "P2025") {
      return new NextResponse("Department not found", { status: 404 });
    }
    
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// DELETE /api/departments/[id] - Delete department
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  // Only Admin can delete departments
  if (!session || (session.user as any).role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { id } = await params;

    // Check if department has doctors
    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            doctors: true
          }
        }
      }
    });

    if (!department) {
      return new NextResponse("Department not found", { status: 404 });
    }

    if (department._count.doctors > 0) {
      return new NextResponse(
        `Cannot delete department with ${department._count.doctors} assigned doctor(s). Please reassign doctors first.`,
        { status: 400 }
      );
    }

    await prisma.department.delete({
      where: { id }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    console.error("Delete Department Error:", error);
    
    if (error.code === "P2025") {
      return new NextResponse("Department not found", { status: 404 });
    }
    
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
