// app/dashboard/admin/doctors/page.tsx
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import prisma from "@/lib/prisma";
import AddUserButton from "@/components/admin/AddUserButton";
import DoctorFeeTable from "./DoctorFeeTable";

export default async function AdminDoctorsPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session || (session.user as any).role !== "ADMIN") {
    redirect("/login");
  }

  const doctors = await prisma.doctor.findMany({
    orderBy: { user: { createdAt: "desc" } },
    select: {
      id: true,
      specialization: true,
      consultationFee: true,
      bio: true,
      profilePhoto: true,
      department: {
        select: { id: true, name: true, consultationFee: true }
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          createdAt: true,
          role: true,
        }
      }
    }
  });

  const serialized = doctors.map((d) => ({
    ...d,
    consultationFee: d.consultationFee ? Number(d.consultationFee) : null,
    department: d.department
      ? { ...d.department, consultationFee: Number(d.department.consultationFee) }
      : null,
    user: {
      ...d.user,
      createdAt: d.user.createdAt.toISOString(),
    },
  }));

  return (
    <DashboardLayout role="admin">
      <div className="space-y-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-1.5 h-10 bg-[#1E4A8A] dark:bg-[#4A8AC8] rounded-full" />
            <div>
              <h1 className="text-4xl font-black text-[#1A2A4A] dark:text-[#E8EEF8] tracking-tighter">
                Medical Specialists
              </h1>
              <p className="text-[#5A6E8A] dark:text-[#8A9CBA] font-medium">
                Directory of active clinical practitioners — manage fees inline.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <AddUserButton role="DOCTOR" label="Add Doctor" colorClass="bg-[#1E4A8A]" />
            <div className="bg-white dark:bg-[#111C3A] px-8 py-4 rounded-2xl border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-sm">
              <p className="text-[10px] font-black text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-[0.2em] mb-1">
                On-Duty Doctors
              </p>
              <p className="text-3xl font-black text-[#1E4A8A] dark:text-[#4A8AC8] tracking-tighter">
                {doctors.length}
              </p>
            </div>
          </div>
        </div>

        <DoctorFeeTable doctors={serialized} />
      </div>
    </DashboardLayout>
  );
}
