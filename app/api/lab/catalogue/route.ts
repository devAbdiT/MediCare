// app/api/lab/catalogue/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET /api/lab/catalogue
// Filters: ?active=true | ?q=searchterm
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get("active") === "true";
    const q = searchParams.get("q")?.trim();

    const tests = await prisma.labTestCatalogue.findMany({
      where: {
        ...(activeOnly ? { isActive: true } : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { code: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { code: "asc" },
    });

    return NextResponse.json(tests);
  } catch (error) {
    console.error("GET Lab Catalogue Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch lab test catalogue" },
      { status: 500 }
    );
  }
}

// POST /api/lab/catalogue — ADMIN only
export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, code, category, referenceRange, unit, turnaroundHrs, price } =
      body;

    if (!name || !code || !category) {
      return NextResponse.json(
        { error: "name, code, and category are required" },
        { status: 400 }
      );
    }

    const formattedCode = code.trim().toUpperCase();

    const existing = await prisma.labTestCatalogue.findUnique({
      where: { code: formattedCode },
    });

    if (existing) {
      return NextResponse.json(
        { error: `A test with code '${formattedCode}' already exists.` },
        { status: 409 }
      );
    }

    const test = await prisma.labTestCatalogue.create({
      data: {
        name: name.trim(),
        code: formattedCode,
        category: category.trim(),
        referenceRange: referenceRange?.trim() || null,
        unit: unit?.trim() || null,
        turnaroundHrs: turnaroundHrs ? Number(turnaroundHrs) : null,
        price: price !== undefined && price !== "" ? Number(price) : null,
      },
    });

    return NextResponse.json(test, { status: 201 });
  } catch (error) {
    console.error("POST Lab Catalogue Error:", error);
    return NextResponse.json(
      { error: "Failed to create lab test" },
      { status: 500 }
    );
  }
}
