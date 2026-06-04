// app/api/services/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ServiceCategory } from "@prisma/client";

// GET /api/services - Retrieve all services
// Optional filter: ?active=true
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get("active") === "true";

    const services = await prisma.service.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { code: "asc" },
    });

    return NextResponse.json(services);
  } catch (error) {
    console.error("GET Services Error:", error);
    return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 });
  }
}

// POST /api/services - Create a new service (ADMIN only)
export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, code, category, unitPrice, description } = body;

    // Basic Validation
    if (!name || !code || !category || unitPrice === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate category enum
    const validCategories = Object.values(ServiceCategory);
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${validCategories.join(", ")}` },
        { status: 400 }
      );
    }

    // Format code: UPPERCASE and trimmed
    const formattedCode = code.trim().toUpperCase();

    // Check uniqueness of code
    const existing = await prisma.service.findUnique({
      where: { code: formattedCode },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Service with code '${formattedCode}' already exists.` },
        { status: 409 }
      );
    }

    const service = await prisma.service.create({
      data: {
        name: name.trim(),
        code: formattedCode,
        category,
        unitPrice: Number(unitPrice),
        description: description ? description.trim() : null,
      },
    });

    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    console.error("POST Service Error:", error);
    return NextResponse.json({ error: "Failed to create service" }, { status: 500 });
  }
}
