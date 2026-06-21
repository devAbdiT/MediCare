import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = session.user as any;
    const role = user.role as string;
    const { id } = await params;

    const existingReferral = await prisma.referral.findUnique({ where: { id } });
    if (!existingReferral) return NextResponse.json({ error: "Referral not found" }, { status: 404 });

    if (role === "DOCTOR") {
      const doctor = await prisma.doctor.findUnique({ where: { userId: user.id } });
      if (!doctor) return NextResponse.json({ error: "Doctor profile not found" }, { status: 404 });
      
      const isTargetDoctor = existingReferral.toDoctorId === doctor.id;
      const isTargetDept = existingReferral.toDepartmentId === doctor.departmentId;
      const isSender = existingReferral.fromDoctorId === doctor.id;
      
      if (!isTargetDoctor && !isTargetDept && !isSender) {
         return NextResponse.json({ error: "Forbidden: You cannot modify this referral" }, { status: 403 });
      }
    } else if (role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { status } = body;

    if (!["ACCEPTED", "COMPLETED", "CANCELLED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updateData: any = { status };
    if (status === "COMPLETED" || status === "CANCELLED") {
      updateData.resolvedAt = new Date();
    }

    const updatedReferral = await prisma.referral.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json(updatedReferral);
  } catch (error) {
    console.error("PATCH Referral Error:", error);
    return NextResponse.json({ error: "Failed to update referral" }, { status: 500 });
  }
}
