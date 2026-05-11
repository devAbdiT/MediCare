// app/api/departments/route.ts
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

// GET /api/departments - List all departments
export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const departments = await prisma.department.findMany({
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
        },
        _count: {
          select: {
            doctors: true
          }
        }
      },
      orderBy: {
        name: "asc"
      }
    });

    return NextResponse.json(departments);
  } catch (error) {
    console.error("Fetch Departments Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// POST /api/departments - Create new department
export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  // Only Admin can create departments
  if (!session || (session.user as any).role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, description } = body;

    if (!name) {
      return new NextResponse("Department name is required", { status: 400 });
    }

    // Check if department already exists
    const existing = await prisma.department.findUnique({
      where: { name }
    });

    if (existing) {
      return new NextResponse("Department with this name already exists", { status: 400 });
    }

    const department = await prisma.department.create({
      data: {
        name,
        description
      }
    });

    return NextResponse.json(department);
  } catch (error: any) {
    console.error("Create Department Error:", error);
    
    if (error.code === "P2002") {
      return new NextResponse("Department name must be unique", { status: 400 });
    }
    
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
