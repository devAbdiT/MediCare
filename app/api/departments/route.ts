import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET() {
  try {
    const departments = await prisma.department.findMany({
      include: {
        doctors: {
          include: {
            user: { select: { name: true } }
          }
        }
      },
      orderBy: { name: "asc" }
    });
    return NextResponse.json(departments);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch departments" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, description } = body;

    const department = await prisma.department.create({
      data: { name, description }
    });
    return NextResponse.json(department);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create department" }, { status: 500 });
  }
}
