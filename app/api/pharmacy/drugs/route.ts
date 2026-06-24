import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const active = searchParams.get("active");
    const q = searchParams.get("q");

    const where: any = {};
    if (active === "true") where.isActive = true;
    if (active === "false") where.isActive = false;
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { genericName: { contains: q, mode: "insensitive" } },
      ];
    }

    const drugs = await prisma.drug.findMany({
      where,
      include: {
        stocks: true,
      },
      orderBy: { name: "asc" },
    });

    const formattedDrugs = drugs.map((drug: any) => {
      const totalStock = drug.stocks.reduce((acc: number, stock: any) => acc + stock.quantity, 0);
      return {
        ...drug,
        totalStock,
      };
    });

    return NextResponse.json(formattedDrugs);
  } catch (error) {
    console.error("GET Drugs Error:", error);
    return NextResponse.json({ error: "Failed to fetch drugs" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (role !== "PHARMACIST" && role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { name, genericName, category, form, strength, unit, reorderLevel } = body;

    if (!name || !category || !form || !unit) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const drug = await prisma.drug.create({
      data: {
        name,
        genericName,
        category,
        form,
        strength,
        unit,
        reorderLevel: Number(reorderLevel) || 10,
        isActive: true,
      },
    });

    return NextResponse.json(drug);
  } catch (error) {
    console.error("POST Drug Error:", error);
    return NextResponse.json({ error: "Failed to create drug" }, { status: 500 });
  }
}
