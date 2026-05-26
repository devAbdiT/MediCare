import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const histories = await prisma.appointmentHistory.findMany({
      where: { appointmentId: id },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(histories);
  } catch (error) {
    console.error("Fetch Appointment History Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
