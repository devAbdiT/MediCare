// app/dashboard/doctor/profile/page.tsx
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import prisma from "@/lib/prisma";
import DoctorProfileForm from "./DoctorProfileForm";

export default async function DoctorProfilePage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session || (session.user as any).role !== "DOCTOR") {
    redirect("/login");
  }

  const doctor = await prisma.doctor.findUnique({
    where: { userId: session.user.id },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      department: { select: { id: true, name: true, consultationFee: true } },
    },
  });

  if (!doctor) redirect("/dashboard/doctor");

  const serialized = {
    id: doctor.id,
    specialization: doctor.specialization,
    bio: doctor.bio,
    profilePhoto: doctor.profilePhoto,
    licenseNumber: (doctor as any).licenseNumber ?? null,
    qualifications: (doctor as any).qualifications ?? null,
    consultationFee: doctor.consultationFee ? Number(doctor.consultationFee) : null,
    department: doctor.department
      ? {
          id: doctor.department.id,
          name: doctor.department.name,
          consultationFee: Number(doctor.department.consultationFee),
        }
      : null,
    user: {
      id: doctor.user.id,
      name: doctor.user.name,
      email: doctor.user.email,
      phone: doctor.user.phone,
    },
  };

  return (
    <DashboardLayout role="doctor">
      <DoctorProfileForm doctor={serialized} />
    </DashboardLayout>
  );
}
