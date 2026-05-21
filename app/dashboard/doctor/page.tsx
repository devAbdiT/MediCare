// app/dashboard/doctor/page.tsx
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import prisma from "@/lib/prisma";
import { format } from "date-fns";
import { Calendar, Clock, User, ExternalLink, Activity, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import React from "react";
import { cn } from "@/lib/utils";

export default async function DoctorDashboard() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session || (session.user as any).role !== "DOCTOR") {
    redirect("/login");
  }

  const doctor = await prisma.doctor.findUnique({
    where: { userId: session.user.id }
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const appointments = await prisma.appointment.findMany({
    where: {
      doctorId: doctor?.id,
      dateTime: { gte: today }, // Show all upcoming appointments
      status: { not: "CANCELLED" }
    },
    include: {
      patient: { include: { user: { select: { name: true, phone: true } } } }
    },
    orderBy: { dateTime: "asc" }
  });

  const completedCount = appointments.filter(a => a.status === "COMPLETED").length;
  const remainingCount = appointments.length - completedCount;

  return (
    <DashboardLayout role="doctor">
      <div className="space-y-10 pb-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-8 bg-[#1E4A8A] dark:bg-[#4A8AC8] rounded-full" />
              <h1 className="text-4xl font-black text-[#1A2A4A] dark:text-[#E8EEF8] tracking-tighter">Clinical Workspace</h1>
            </div>
            <p className="text-[#5A6E8A] dark:text-[#8A9CBA] text-lg font-medium">Monitoring {appointments.length} active consultations.</p>
          </div>
          <div className="flex items-center gap-3 bg-[#F0F4F8] dark:bg-[#0A122A] p-2 rounded-2xl border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-sm transition-colors duration-500">
            <div className="px-5 py-3 bg-white dark:bg-[#111C3A] rounded-xl flex items-center gap-3">
              <Calendar className="text-[#1E4A8A] dark:text-[#4A8AC8]" size={18} />
              <span className="font-black text-[#1A2A4A] dark:text-[#E8EEF8] text-sm tracking-tight">{format(new Date(), "MMMM dd, yyyy")}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <StatBox label="Daily Quota" value={appointments.length.toString()} icon={<User />} color="text-[#1E4A8A] dark:text-[#4A8AC8]" />
          <StatBox label="Successful Visits" value={completedCount.toString()} icon={<Activity />} color="text-emerald-600 dark:text-emerald-400" />
          <StatBox label="Pending Sync" value={remainingCount.toString()} icon={<Clock />} color="text-[#F59E0B] dark:text-[#FBBF24]" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Timeline View */}
          <div className="lg:col-span-3 bg-[#F0F4F8] dark:bg-[#0A122A] p-10 rounded-[3rem] border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-sm relative overflow-hidden transition-colors duration-500">
             <div className="flex items-center justify-between mb-10">
                <h2 className="text-2xl font-black text-[#1A2A4A] dark:text-[#E8EEF8] tracking-tight">Active Schedule</h2>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#1E4A8A] dark:bg-[#4A8AC8] rounded-full animate-pulse" />
                  <span className="text-[10px] font-black text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-widest">Real-time sync</span>
                </div>
             </div>

             <div className="space-y-4">
                {appointments.length === 0 ? (
                   <div className="text-center py-20 bg-white dark:bg-[#111C3A] rounded-[2rem] border-2 border-dashed border-[#D0DCE8] dark:border-[#1A2A4A]">
                     <p className="text-[#5A6E8A] dark:text-[#8A9CBA] font-bold italic">No upcoming patients queued.</p>
                   </div>
                ) : (
                   appointments.map((appt) => (
                    <div key={appt.id} className="group flex items-center gap-8 p-6 rounded-[2.5rem] bg-white dark:bg-[#111C3A] border border-[#D0DCE8] dark:border-[#1A2A4A] hover:border-[#1E4A8A] dark:hover:border-[#4A8AC8] hover:shadow-2xl hover:shadow-blue-500/5 transition-all duration-500">
                       <div className="text-center min-w-[80px]">
                          <p className="text-[10px] font-black text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-widest">{format(appt.dateTime, "MMM dd")}</p>
                          <p className="text-2xl font-black text-[#1A2A4A] dark:text-[#E8EEF8] leading-none my-1">{format(appt.dateTime, "HH:mm")}</p>
                       </div>
                       <div className="w-1.5 h-12 bg-[#F0F4F8] dark:bg-[#0A122A] rounded-full group-hover:bg-[#1E4A8A] dark:group-hover:bg-[#4A8AC8] transition-colors" />
                       <div className="flex-1">
                          <p className="text-[10px] font-black text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-widest mb-1">Patient Encounter</p>
                          <h4 className="text-xl font-black text-[#1A2A4A] dark:text-[#E8EEF8]">{appt.patient.user.name}</h4>
                       </div>
                       <div className="flex items-center gap-4">
                          <Badge className={cn(
                            "rounded-full px-4 py-1.5 font-black text-[10px] uppercase tracking-widest border-none shadow-sm",
                            appt.status === "SCHEDULED" ? "bg-[#1E4A8A]/10 dark:bg-[#4A8AC8]/10 text-[#1E4A8A] dark:text-[#4A8AC8]" : "bg-emerald-500/10 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          )}>
                             {appt.status}
                          </Badge>
                          <Link href={`/dashboard/doctor/appointments/${appt.id}`}>
                            <button className="p-4 bg-[#1A2A4A] dark:bg-[#111C3A] text-white rounded-[1.5rem] hover:bg-[#1E4A8A] dark:hover:bg-[#4A8AC8] hover:text-white dark:hover:text-[#0A122A] border border-[#D0DCE8] dark:border-[#1A2A4A] transition-all shadow-xl shadow-slate-200 dark:shadow-none">
                              <ArrowRight size={20} />
                            </button>
                          </Link>
                       </div>
                    </div>
                  ))
                )}
             </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="space-y-6">
             <div className="bg-[#1E4A8A] dark:bg-[#111C3A] border border-transparent dark:border-[#1A2A4A] p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group transition-all duration-500">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#4A8AC8] rounded-full blur-[60px] opacity-20 group-hover:scale-150 transition-transform duration-700" />
                <h3 className="text-2xl font-black mb-6 tracking-tight">Active Duty</h3>
                <div className="space-y-6">
                   <div>
                      <p className="text-[10px] font-black text-[#8A9CBA] uppercase tracking-widest mb-2">Primary Specialization</p>
                      <p className="text-lg font-black text-white dark:text-[#4A8AC8]">{doctor?.specialization}</p>
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-[#8A9CBA] uppercase tracking-widest mb-2">Shift Progress</p>
                      <div className="w-full h-1.5 bg-white/5 rounded-full mt-3 overflow-hidden">
                         <div className="h-full bg-white dark:bg-[#4A8AC8] rounded-full" style={{ width: `${(completedCount / (appointments.length || 1)) * 100}%` }} />
                      </div>
                   </div>
                </div>
                <Link href="/dashboard/doctor/patients">
                  <button className="w-full mt-10 py-4 bg-white hover:bg-white/90 text-[#1E4A8A] dark:bg-[#4A8AC8] dark:hover:bg-[#4A8AC8]/90 dark:text-[#0A122A] rounded-2xl font-black text-xs uppercase tracking-widest transition-all">
                     Patient History Search
                  </button>
                </Link>
             </div>

             <div className="bg-[#F0F4F8] dark:bg-[#0A122A] p-8 rounded-[2.5rem] border border-[#D0DCE8] dark:border-[#1A2A4A] text-center transition-colors duration-500">
                <div className="w-12 h-12 bg-emerald-500/10 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                   <ExternalLink size={20} />
                </div>
                <h4 className="font-black text-[#1A2A4A] dark:text-[#E8EEF8] mb-1">Global Drug Index</h4>
                <p className="text-xs font-medium text-[#5A6E8A] dark:text-[#8A9CBA]">Access interactions and dosing</p>
             </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatBox({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-[#F0F4F8] dark:bg-[#0A122A] p-8 rounded-[2.5rem] border border-[#D0DCE8] dark:border-[#1A2A4A] flex items-center justify-between group hover:border-[#1E4A8A] dark:hover:border-[#4A8AC8] transition-all shadow-sm transition-colors duration-500">
       <div>
          <p className="text-[10px] font-black text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-widest mb-1">{label}</p>
          <p className="text-4xl font-black text-[#1A2A4A] dark:text-[#E8EEF8] tracking-tighter">{value}</p>
       </div>
       <div className={cn("w-14 h-14 rounded-2xl bg-white dark:bg-[#111C3A] flex items-center justify-center group-hover:scale-110 transition-transform", color)}>
          {React.cloneElement(icon as React.ReactElement, { size: 28 } as any)}
       </div>
    </div>
  );
}
