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
          <h1 className="text-4xl font-black text-[#1A2A4A] dark:text-[#E8EEF8] tracking-tight">Master Schedule</h1>
          <p className="text-[#5A6E8A] dark:text-[#8A9CBA] mt-2 font-medium">Overview of all clinic appointments</p>
        </div>

        <div className="bg-white dark:bg-[#111C3A] rounded-[2.5rem] border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-sm overflow-hidden transition-colors duration-500">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F0F4F8] dark:bg-[#0A122A] border-b border-[#D0DCE8] dark:border-[#1A2A4A] text-[#5A6E8A] dark:text-[#8A9CBA] text-[10px] font-black uppercase tracking-widest transition-colors duration-500">
                  <th className="px-8 py-6">Date & Time</th>
                  <th className="px-8 py-6">Patient</th>
                  <th className="px-8 py-6">Assigned Doctor</th>
                  <th className="px-8 py-6">Status</th>
                  <th className="px-8 py-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F4F8] dark:divide-[#0A122A]">
                {appointments.map((appt) => (
                  <tr key={appt.id} className="hover:bg-[#F0F4F8]/50 dark:hover:bg-[#0A122A]/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex flex-col items-center justify-center text-[#1E4A8A] dark:text-[#4A8AC8] font-bold group-hover:bg-[#1E4A8A] dark:group-hover:bg-[#4A8AC8] group-hover:text-white transition-all">
                          <span className="text-[10px] uppercase leading-none">{format(new Date(appt.dateTime), "MMM")}</span>
                          <span className="text-lg leading-none">{format(new Date(appt.dateTime), "dd")}</span>
                        </div>
                        <div>
                          <p className="font-bold text-[#1A2A4A] dark:text-[#E8EEF8] flex items-center gap-2">
                            <Clock size={14} className="text-[#5A6E8A] dark:text-[#8A9CBA]" />
                            {format(new Date(appt.dateTime), "HH:mm")}
                          </p>
                          <p className="text-xs text-[#5A6E8A] dark:text-[#8A9CBA] font-medium">Visit ID: {appt.id.slice(-6).toUpperCase()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#F0F4F8] dark:bg-[#0A122A] flex items-center justify-center text-[#5A6E8A] dark:text-[#8A9CBA]">
                          <User size={14} />
                        </div>
                        <span className="font-bold text-[#1A2A4A] dark:text-[#E8EEF8]">{appt.patient.user.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-[#1E4A8A] dark:text-[#4A8AC8]">
                          <Stethoscope size={14} />
                        </div>
                        <div>
                          <p className="font-bold text-[#1A2A4A] dark:text-[#E8EEF8]">Dr. {appt.doctor.user.name}</p>
                          <p className="text-[10px] text-[#1E4A8A] dark:text-[#4A8AC8] font-bold uppercase tracking-wider">{appt.doctor.specialization}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <Badge variant={appt.status === "SCHEDULED" ? "default" : "outline"} className="rounded-lg px-3 py-1 font-bold">
                        {appt.status}
                      </Badge>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button className="text-sm font-black text-[#1E4A8A] dark:text-[#4A8AC8] hover:text-[#0F3A6A] dark:hover:text-[#1E4A8A] underline underline-offset-4">
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
