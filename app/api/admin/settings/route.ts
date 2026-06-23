import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { defaultSettings } from "@/lib/settings";

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let record = await prisma.systemSettings.findUnique({
      where: { id: "singleton" },
    });

    if (!record) {
      record = await prisma.systemSettings.create({
        data: {
          id: "singleton",
          data: defaultSettings as any,
        },
      });
    }

    return NextResponse.json(record.data);
  } catch (error) {
    console.error("GET Settings Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();

    const record = await prisma.systemSettings.upsert({
      where: { id: "singleton" },
      create: {
        id: "singleton",
        data: data,
      },
      update: {
        data: data,
      },
    });

    return NextResponse.json(record.data);
  } catch (error) {
    console.error("PATCH Settings Error:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
