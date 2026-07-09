// app/api/patients/[id]/route.ts
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { PatientStatus } from "@prisma/client";
import { createAuditLog } from "@/lib/audit";

// GET /api/patients/[id] - Retrieve patient details (Staff or the Patient themselves)
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          phone: true,
        }
      }
    }
  });

  if (!patient) {
    return new NextResponse("Not Found", { status: 404 });
  }

  // Authorization: staff or the patient themselves
  const userRole = (session.user as any).role;
  const isStaff = ["ADMIN", "RECEPTIONIST", "DOCTOR"].includes(userRole);
  if (!isStaff && patient.userId !== session.user.id) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  return NextResponse.json(patient);
}

// PATCH /api/patients/[id] - Update patient profile details
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const patient = await prisma.patient.findUnique({
      where: { id },
    });

    if (!patient) {
      return new NextResponse("Patient not found", { status: 404 });
    }

    // Authorization: staff or the patient themselves
    const userRole = (session.user as any).role;
    const isStaff = ["ADMIN", "RECEPTIONIST", "DOCTOR"].includes(userRole);
    if (!isStaff && patient.userId !== session.user.id) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const body = await req.json();
    const {
      address,
      city,
      region,
      emergencyName,
      emergencyPhone,
      emergencyRelation,
      patientStatus,
      insuranceProvider,
      insurancePolicyNo,
      insuranceCoverage,
      insuranceExpiry
    } = body;

    const updateData: any = {};

    if (address !== undefined) updateData.address = address ? address.trim() : null;
    if (city !== undefined) updateData.city = city ? city.trim() : null;
    if (region !== undefined) updateData.region = region ? region.trim() : null;
    if (emergencyName !== undefined) updateData.emergencyName = emergencyName ? emergencyName.trim() : null;
    if (emergencyPhone !== undefined) updateData.emergencyPhone = emergencyPhone ? emergencyPhone.trim() : null;
    if (emergencyRelation !== undefined) updateData.emergencyRelation = emergencyRelation ? emergencyRelation.trim() : null;

    if (insuranceProvider !== undefined) updateData.insuranceProvider = insuranceProvider ? insuranceProvider.trim() : null;
    if (insurancePolicyNo !== undefined) updateData.insurancePolicyNo = insurancePolicyNo ? insurancePolicyNo.trim() : null;
    if (insuranceCoverage !== undefined) updateData.insuranceCoverage = insuranceCoverage ? insuranceCoverage.trim() : null;

    if (insuranceExpiry !== undefined) {
      updateData.insuranceExpiry = insuranceExpiry ? new Date(insuranceExpiry) : null;
    }

    if (patientStatus !== undefined) {
      const validStatuses = Object.values(PatientStatus);
      if (!validStatuses.includes(patientStatus)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
          { status: 400 }
        );
      }
      updateData.patientStatus = patientStatus;
    }

    const updatedPatient = await prisma.patient.update({
      where: { id },
      data: updateData,
    });

    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "127.0.0.1";
    
    // Only log if something actually changed
    if (Object.keys(updateData).length > 0) {
      await createAuditLog({
        userId: session.user.id,
        userRole: (session.user as any).role,
        action: "UPDATE",
        entity: "Patient",
        entityId: id,
        oldValues: {
          address: patient.address, city: patient.city, region: patient.region,
          emergencyName: patient.emergencyName, emergencyPhone: patient.emergencyPhone, emergencyRelation: patient.emergencyRelation,
          insuranceProvider: patient.insuranceProvider, insurancePolicyNo: patient.insurancePolicyNo, insuranceCoverage: patient.insuranceCoverage, insuranceExpiry: patient.insuranceExpiry,
          patientStatus: patient.patientStatus
        },
        newValues: updateData,
        ipAddress,
      });
    }

    return NextResponse.json(updatedPatient);
  } catch (error) {
    console.error("PATCH Patient Error:", error);
    return NextResponse.json({ error: "Failed to update patient profile" }, { status: 500 });
  }
}
