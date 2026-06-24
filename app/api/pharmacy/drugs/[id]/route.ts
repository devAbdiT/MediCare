import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (role !== "PHARMACIST" && role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    const updatedDrug = await prisma.drug.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(updatedDrug);
  } catch (error) {
    console.error("PATCH Drug Error:", error);
    return NextResponse.json({ error: "Failed to update drug" }, { status: 500 });
  }
}
