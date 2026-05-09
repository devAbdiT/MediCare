// app/dashboard/admin/appointments/page.tsx
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import prisma from "@/lib/prisma";
import { format } from "date-fns";
import { Calendar, Clock, Stethoscope, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default async function AdminAppointmentsPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session || (session.user as any).role !== "ADMIN") {
    redirect("/login");
  }

  const appointments = await prisma.appointment.findMany({
    orderBy: { dateTime: "desc" },
    include: {
      patient: {
        include: { user: { select: { name: true } } }
      },
      doctor: {
        include: { user: { select: { name: true } } }
      }
    }
  });

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-black text-[#1E293B] dark:text-[#F1F5F9] tracking-tight">Master Schedule</h1>
          <p className="text-[#64748B] dark:text-[#94A3B8] mt-2 font-medium">Overview of all clinic appointments</p>
        </div>

        <div className="bg-white dark:bg-[#1E293B] rounded-[2.5rem] border border-[#E2E8F0] dark:border-[#334155] shadow-sm overflow-hidden transition-colors duration-500">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] dark:bg-[#0F172A] border-b border-[#E2E8F0] dark:border-[#334155] text-[#64748B] dark:text-[#94A3B8] text-[10px] font-black uppercase tracking-widest transition-colors duration-500">
                  <th className="px-8 py-6">Date & Time</th>
                  <th className="px-8 py-6">Patient</th>
                  <th className="px-8 py-6">Assigned Doctor</th>
                  <th className="px-8 py-6">Status</th>
                  <th className="px-8 py-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F8FAFC] dark:divide-[#0F172A]">
                {appointments.map((appt) => (
                  <tr key={appt.id} className="hover:bg-[#F8FAFC]/50 dark:hover:bg-[#0F172A]/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex flex-col items-center justify-center text-[#3B82F6] dark:text-[#60A5FA] font-bold group-hover:bg-[#3B82F6] dark:group-hover:bg-[#60A5FA] group-hover:text-white transition-all">
                          <span className="text-[10px] uppercase leading-none">{format(new Date(appt.dateTime), "MMM")}</span>
                          <span className="text-lg leading-none">{format(new Date(appt.dateTime), "dd")}</span>
                        </div>
                        <div>
                          <p className="font-bold text-[#1E293B] dark:text-[#F1F5F9] flex items-center gap-2">
                            <Clock size={14} className="text-[#64748B] dark:text-[#94A3B8]" />
                            {format(new Date(appt.dateTime), "HH:mm")}
                          </p>
                          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] font-medium">Visit ID: {appt.id.slice(-6).toUpperCase()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#F8FAFC] dark:bg-[#0F172A] flex items-center justify-center text-[#64748B] dark:text-[#94A3B8]">
                          <User size={14} />
                        </div>
                        <span className="font-bold text-[#1E293B] dark:text-[#F1F5F9]">{appt.patient.user.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-[#3B82F6] dark:text-[#60A5FA]">
                          <Stethoscope size={14} />
                        </div>
                        <div>
                          <p className="font-bold text-[#1E293B] dark:text-[#F1F5F9]">Dr. {appt.doctor.user.name}</p>
                          <p className="text-[10px] text-[#3B82F6] dark:text-[#60A5FA] font-bold uppercase tracking-wider">{appt.doctor.specialization}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <Badge variant={appt.status === "SCHEDULED" ? "default" : "outline"} className="rounded-lg px-3 py-1 font-bold">
                        {appt.status}
                      </Badge>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button className="text-sm font-black text-[#3B82F6] dark:text-[#60A5FA] hover:text-[#2563EB] dark:hover:text-[#3B82F6] underline underline-offset-4">
                        View Details
                      </button>
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
