import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "";

  const doctors = await prisma.doctor.findMany({
    where: {
      OR: [
        { user: { name: { contains: query, mode: "insensitive" } } },
        { specialization: { contains: query, mode: "insensitive" } },
      ]
    },
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
