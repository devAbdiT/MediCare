import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { startOfDay, endOfDay } from "date-fns";

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const entity = searchParams.get("entity");
    const userId = searchParams.get("userId");
    const action = searchParams.get("action");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const where: any = {};

    if (entity) where.entity = entity;
    if (userId) where.userId = userId;
    if (action) where.action = action;
    
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = startOfDay(new Date(from));
      if (to) where.createdAt.lte = endOfDay(new Date(to));
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    // Enrich with user names
    const userIds = Array.from(new Set(logs.map(l => l.userId)));
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true },
    });
    
    const userMap = new Map(users.map(u => [u.id, u.name]));

    const enrichedLogs = logs.map(log => ({
      ...log,
      userName: userMap.get(log.userId) || "Unknown User",
    }));

    return NextResponse.json({
      data: enrichedLogs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET Audit Logs Error:", error);
    return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 });
  }
}
