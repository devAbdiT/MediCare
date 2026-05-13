import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session || ((session.user as any).role !== "ADMIN" && (session.user as any).role !== "RECEPTIONIST" && (session.user as any).role !== "DOCTOR")) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

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
