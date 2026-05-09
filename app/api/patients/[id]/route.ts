import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "RECEPTIONIST" && session.user.role !== "DOCTOR")) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;

  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          phone: true,
        }
      }
    }
  });

  if (!patient) {
    return new NextResponse("Not Found", { status: 404 });
  }

  return NextResponse.json(patient);
}
