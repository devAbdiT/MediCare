// app/api/doctors/route.ts
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

// GET /api/doctors - List all doctors
export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const doctors = await prisma.doctor.findMany({
    include: {
      user: {
        select: {
          name: true,
          email: true,
        }
      }
    }
  });

  return NextResponse.json(doctors);
}
