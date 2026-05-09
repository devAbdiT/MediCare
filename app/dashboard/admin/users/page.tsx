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
            <h1 className="text-4xl font-black text-[#1E293B] dark:text-[#F1F5F9] tracking-tight">System Users</h1>
            <p className="text-[#64748B] dark:text-[#94A3B8] mt-2 font-medium">Manage all accounts across the platform</p>
          </div>
          <div className="bg-white dark:bg-[#1E293B] px-6 py-3 rounded-2xl border border-[#E2E8F0] dark:border-[#334155] shadow-sm text-sm font-bold text-[#64748B] dark:text-[#94A3B8]">
            Total Users: <span className="text-[#3B82F6] dark:text-[#60A5FA] font-black">{users.length}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1E293B] rounded-[2.5rem] border border-[#E2E8F0] dark:border-[#334155] shadow-sm overflow-hidden transition-colors duration-500">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] dark:bg-[#0F172A] border-b border-[#E2E8F0] dark:border-[#334155] text-[#64748B] dark:text-[#94A3B8] text-[10px] font-black uppercase tracking-widest transition-colors duration-500">
                  <th className="px-8 py-6">User Details</th>
                  <th className="px-8 py-6">Role</th>
                  <th className="px-8 py-6">Contact</th>
                  <th className="px-8 py-6">Joined Date</th>
                  <th className="px-8 py-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F8FAFC] dark:divide-[#0F172A]">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-[#F8FAFC]/50 dark:hover:bg-[#0F172A]/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-[#3B82F6] dark:text-[#60A5FA] group-hover:bg-[#3B82F6] dark:group-hover:bg-[#60A5FA] group-hover:text-white transition-all">
                          <User size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-[#1E293B] dark:text-[#F1F5F9]">{user.name}</p>
                          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] font-medium">{user.id}</p>
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
                        <div className="flex items-center gap-2 text-xs font-bold text-[#64748B] dark:text-[#94A3B8]">
                          <Mail size={12} className="text-[#64748B] dark:text-[#94A3B8]" />
                          {user.email}
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-[#64748B] dark:text-[#94A3B8]">
                          <Phone size={12} className="text-[#64748B] dark:text-[#94A3B8]" />
                          {user.phone || "N/A"}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-sm font-bold text-[#64748B] dark:text-[#94A3B8]">
                        <Calendar size={14} className="text-[#64748B] dark:text-[#94A3B8]" />
                        {format(new Date(user.createdAt), "MMM dd, yyyy")}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#10B981]/10 text-[#10B981] dark:bg-[#34D399]/10 dark:text-[#34D399]">
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
  ADMIN: "bg-[#1E293B] text-white dark:bg-white dark:text-[#1E293B]",
  DOCTOR: "bg-blue-100 text-[#3B82F6] dark:bg-blue-900/40 dark:text-[#60A5FA]",
  RECEPTIONIST: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  PATIENT: "bg-emerald-100 text-[#10B981] dark:bg-emerald-900/40 dark:text-[#34D399]",
};
