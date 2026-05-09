// app/dashboard/admin/users/page.tsx
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import prisma from "@/lib/prisma";
import { format } from "date-fns";
import { User, Shield, Calendar, Phone, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default async function AdminUsersPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session || (session.user as any).role !== "ADMIN") {
    redirect("/login");
  }

  const users = await prisma.user.findMany({
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
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-black text-[#1A2A4A] dark:text-[#E8EEF8] tracking-tight">System Users</h1>
            <p className="text-[#5A6E8A] dark:text-[#8A9CBA] mt-2 font-medium">Manage all accounts across the platform</p>
          </div>
          <div className="bg-white dark:bg-[#111C3A] px-6 py-3 rounded-2xl border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-sm text-sm font-bold text-[#5A6E8A] dark:text-[#8A9CBA]">
            Total Users: <span className="text-[#1E4A8A] dark:text-[#4A8AC8] font-black">{users.length}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111C3A] rounded-[2.5rem] border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-sm overflow-hidden transition-colors duration-500">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F0F4F8] dark:bg-[#0A122A] border-b border-[#D0DCE8] dark:border-[#1A2A4A] text-[#5A6E8A] dark:text-[#8A9CBA] text-[10px] font-black uppercase tracking-widest transition-colors duration-500">
                  <th className="px-8 py-6">User Details</th>
                  <th className="px-8 py-6">Role</th>
                  <th className="px-8 py-6">Contact</th>
                  <th className="px-8 py-6">Joined Date</th>
                  <th className="px-8 py-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F4F8] dark:divide-[#0A122A]">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-[#F0F4F8]/50 dark:hover:bg-[#0A122A]/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-[#1E4A8A] dark:text-[#4A8AC8] group-hover:bg-[#1E4A8A] dark:group-hover:bg-[#4A8AC8] group-hover:text-white transition-all">
                          <User size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-[#1A2A4A] dark:text-[#E8EEF8]">{user.name}</p>
                          <p className="text-xs text-[#5A6E8A] dark:text-[#8A9CBA] font-medium">{user.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <Badge className={roleColors[user.role as keyof typeof roleColors]}>
                        <Shield size={12} className="mr-1" />
                        {user.role}
                      </Badge>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#5A6E8A] dark:text-[#8A9CBA]">
                          <Mail size={12} className="text-[#5A6E8A] dark:text-[#8A9CBA]" />
                          {user.email}
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-[#5A6E8A] dark:text-[#8A9CBA]">
                          <Phone size={12} className="text-[#5A6E8A] dark:text-[#8A9CBA]" />
                          {user.phone || "N/A"}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-sm font-bold text-[#5A6E8A] dark:text-[#8A9CBA]">
                        <Calendar size={14} className="text-[#5A6E8A] dark:text-[#8A9CBA]" />
                        {format(new Date(user.createdAt), "MMM dd, yyyy")}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#2D8A6E]/10 text-[#2D8A6E] dark:bg-[#4AA88A]/10 dark:text-[#4AA88A]">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

const roleColors = {
  ADMIN: "bg-[#1A2A4A] text-white dark:bg-white dark:text-[#1A2A4A]",
  DOCTOR: "bg-blue-100 text-[#1E4A8A] dark:bg-blue-900/40 dark:text-[#4A8AC8]",
  RECEPTIONIST: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  PATIENT: "bg-emerald-100 text-[#2D8A6E] dark:bg-emerald-900/40 dark:text-[#4AA88A]",
};
