// app/dashboard/admin/patients/page.tsx
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import prisma from "@/lib/prisma";
import UserList from "../users/UserList";
import AddUserButton from "@/components/admin/AddUserButton";
import { PrintButton } from "@/components/admin/PrintButton";

export default async function AdminPatientsPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session || (session.user as any).role !== "ADMIN") {
    redirect("/login");
  }

  const users = await prisma.user.findMany({
    where: { role: "PATIENT" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      createdAt: true,
      patient: {
        select: { bloodType: true, dateOfBirth: true }
      }
    }
  });

  return (
    <DashboardLayout role="admin">
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
             <div className="w-1.5 h-10 bg-[#2D8A6E] rounded-full" />
             <div>
                <h1 className="text-4xl font-black text-[#1A2A4A] dark:text-[#E8EEF8] tracking-tighter">Patient Directory</h1>
                <p className="text-[#5A6E8A] dark:text-[#8A9CBA] font-medium">Accessing verified clinical patient records.</p>
             </div>
          </div>
          <div className="flex items-center gap-6">
            <AddUserButton role="PATIENT" label="Add Patient" colorClass="bg-[#2D8A6E]" />
            <div className="bg-white dark:bg-[#111C3A] px-8 py-4 rounded-2xl border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-sm transition-colors duration-500">
              <p className="text-[10px] font-black text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-[0.2em] mb-1">Active Patients</p>
              <p className="text-3xl font-black text-[#2D8A6E] tracking-tighter">{users.length}</p>
            </div>
          </div>
        </div>

        <UserList users={users} adminName={session.user.name} />
      </div>
    </DashboardLayout>
  );
}
