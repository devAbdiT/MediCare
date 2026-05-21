// app/api/patients/search/route.ts
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session || ((session.user as any).role !== "ADMIN" && (session.user as any).role !== "RECEPTIONIST" && (session.user as any).role !== "DOCTOR")) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "";

  const patients = await prisma.patient.findMany({
    where: {
      OR: [
        { user: { name: { contains: query, mode: "insensitive" } } },
        { user: { email: { contains: query, mode: "insensitive" } } },
        { user: { phone: { contains: query, mode: "insensitive" } } },
        { cardNumber: { contains: query, mode: "insensitive" } },
      ]
    },
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

  const formattedPatients = patients.map(p => ({
    id: p.id,
    name: p.user.name,
    email: p.user.email,
    phone: p.user.phone,
    bloodType: p.bloodType,
    age: p.age,
    dateOfBirth: p.dateOfBirth ? p.dateOfBirth.toISOString() : null,
    cardNumber: p.cardNumber
  }));

  return NextResponse.json(formattedPatients);
}
