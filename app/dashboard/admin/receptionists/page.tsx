// app/dashboard/admin/receptionists/page.tsx
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import prisma from "@/lib/prisma";
import UserList from "../users/UserList";
import AddUserButton from "@/components/admin/AddUserButton";
import { PrintButton } from "@/components/admin/PrintButton";

export default async function AdminReceptionistsPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session || (session.user as any).role !== "ADMIN") {
    redirect("/login");
  }

  const users = await prisma.user.findMany({
    where: { role: "RECEPTIONIST" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      createdAt: true,
    }
  });

  return (
    <DashboardLayout role="admin">
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
             <div className="w-1.5 h-10 bg-purple-500 rounded-full" />
             <div>
                <h1 className="text-4xl font-black text-[#1A2A4A] dark:text-[#E8EEF8] tracking-tighter">Front Desk Staff</h1>
                <p className="text-[#5A6E8A] dark:text-[#8A9CBA] font-medium">Managing administrative and operational personnel.</p>
             </div>
          </div>
          <div className="flex items-center gap-6">
            <AddUserButton role="RECEPTIONIST" label="Add Staff" colorClass="bg-purple-600" />
            <div className="bg-white dark:bg-[#111C3A] px-8 py-4 rounded-2xl border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-sm transition-colors duration-500">
              <p className="text-[10px] font-black text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-[0.2em] mb-1">Total Staff</p>
              <p className="text-3xl font-black text-purple-600 tracking-tighter">{users.length}</p>
            </div>
          </div>
        </div>

        <UserList users={users} adminName={session.user.name} />
      </div>
    </DashboardLayout>
  );
}
