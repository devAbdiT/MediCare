// app/api/lab/catalogue/[id]/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// PATCH /api/lab/catalogue/[id] — Update fields or toggle isActive. ADMIN only.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.labTestCatalogue.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Lab test not found" }, { status: 404 });
    }

    const body = await req.json();
    const {
      name,
      code,
      category,
      referenceRange,
      unit,
      turnaroundHrs,
      price,
      isActive,
    } = body;

    // If code is being updated, check uniqueness
    if (code && code.trim().toUpperCase() !== existing.code) {
      const conflict = await prisma.labTestCatalogue.findUnique({
        where: { code: code.trim().toUpperCase() },
      });
      if (conflict) {
        return NextResponse.json(
          { error: `A test with code '${code.trim().toUpperCase()}' already exists.` },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.labTestCatalogue.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(code !== undefined ? { code: code.trim().toUpperCase() } : {}),
        ...(category !== undefined ? { category: category.trim() } : {}),
        ...(referenceRange !== undefined
          ? { referenceRange: referenceRange?.trim() || null }
          : {}),
        ...(unit !== undefined ? { unit: unit?.trim() || null } : {}),
        ...(turnaroundHrs !== undefined
          ? { turnaroundHrs: turnaroundHrs !== "" ? Number(turnaroundHrs) : null }
          : {}),
        ...(price !== undefined
          ? { price: price !== "" ? Number(price) : null }
          : {}),
        ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH Lab Catalogue Error:", error);
    return NextResponse.json(
      { error: "Failed to update lab test" },
      { status: 500 }
    );
  }
}
