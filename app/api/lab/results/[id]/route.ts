// app/api/lab/results/[id]/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as any).role as string;
    if (!["LABTECH", "ADMIN"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { resultValue, unit, referenceRange, isAbnormal, interpretation } = body;

    const existing = await prisma.labResult.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Result not found" }, { status: 404 });
    }

    const updated = await prisma.labResult.update({
      where: { id },
      data: {
        ...(resultValue !== undefined && { resultValue }),
        ...(unit !== undefined && { unit }),
        ...(referenceRange !== undefined && { referenceRange }),
        ...(isAbnormal !== undefined && { isAbnormal }),
        ...(interpretation !== undefined && { interpretation }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH Lab Result Error:", error);
    return NextResponse.json({ error: "Failed to update lab result" }, { status: 500 });
  }
}
