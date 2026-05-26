// app/dashboard/admin/appointments/page.tsx
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import prisma from "@/lib/prisma";
import { format } from "date-fns";
import { Calendar, Clock, Stethoscope, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

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
        include: { user: { select: { id: true, name: true } } }
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
                        <div>
                          <p className="font-bold text-[#1A2A4A] dark:text-[#E8EEF8]">{appt.patient.user.name}</p>
                          <div className="flex gap-1.5 mt-1.5 flex-wrap">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                              (appt.appointmentType || "NEW_VISIT") === "NEW_VISIT" ? "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900" :
                              (appt.appointmentType || "NEW_VISIT") === "FOLLOW_UP" ? "bg-teal-50 text-teal-700 border-teal-100 dark:bg-teal-900/20 dark:text-teal-400 dark:border-teal-900" :
                              (appt.appointmentType || "NEW_VISIT") === "CONSULTATION" ? "bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-900" :
                              "bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900"
                            }`}>
                              {(appt.appointmentType || "NEW_VISIT").replace("_", " ")}
                            </span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                              (appt.priority || "NORMAL") === "URGENT" ? "bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800" :
                              (appt.priority || "NORMAL") === "EMERGENCY" ? "bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800 animate-pulse font-black" :
                              "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            }`}>
                              {appt.priority || "NORMAL"}
                            </span>
                          </div>
                        </div>
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
