// app/api/services/[id]/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ServiceCategory } from "@prisma/client";

// PATCH /api/services/[id] - Update a service (ADMIN only)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const service = await prisma.service.findUnique({
      where: { id },
    });

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    const body = await req.json();
    const { name, code, category, unitPrice, description, isActive } = body;

    const updateData: any = {};

    if (name !== undefined) updateData.name = name.trim();
    if (category !== undefined) {
      const validCategories = Object.values(ServiceCategory);
      if (!validCategories.includes(category)) {
        return NextResponse.json(
          { error: `Invalid category. Must be one of: ${validCategories.join(", ")}` },
          { status: 400 }
        );
      }
      updateData.category = category;
    }
    if (unitPrice !== undefined) updateData.unitPrice = Number(unitPrice);
    if (description !== undefined) updateData.description = description ? description.trim() : null;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    if (code !== undefined) {
      const formattedCode = code.trim().toUpperCase();
      // If code changed, check uniqueness
      if (formattedCode !== service.code) {
        const existing = await prisma.service.findUnique({
          where: { code: formattedCode },
        });
        if (existing) {
          return NextResponse.json(
            { error: `Service with code '${formattedCode}' already exists.` },
            { status: 409 }
          );
        }
      }
      updateData.code = formattedCode;
    }

    const updatedService = await prisma.service.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedService);
  } catch (error) {
    console.error("PATCH Service Error:", error);
    return NextResponse.json({ error: "Failed to update service" }, { status: 500 });
  }
}

// DELETE /api/services/[id] - Soft delete a service (ADMIN only)
// Soft delete sets isActive: false
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const service = await prisma.service.findUnique({
      where: { id },
    });

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    const updatedService = await prisma.service.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true, service: updatedService });
  } catch (error) {
    console.error("DELETE Service Error:", error);
    return NextResponse.json({ error: "Failed to delete service" }, { status: 500 });
  }
}
