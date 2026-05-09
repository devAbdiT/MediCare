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
              <div className="w-2 h-8 bg-[#3B82F6] dark:bg-[#60A5FA] rounded-full" />
              <h1 className="text-4xl font-black text-[#1E293B] dark:text-[#F1F5F9] tracking-tighter">Clinical Workspace</h1>
            </div>
            <p className="text-[#64748B] dark:text-[#94A3B8] text-lg font-medium">Monitoring {appointments.length} active consultations.</p>
          </div>
          <div className="flex items-center gap-3 bg-white dark:bg-[#1E293B] p-2 rounded-2xl border border-[#E2E8F0] dark:border-[#334155] shadow-sm transition-colors duration-500">
            <div className="px-5 py-3 bg-[#F8FAFC] dark:bg-[#0F172A] rounded-xl flex items-center gap-3">
              <Calendar className="text-[#3B82F6] dark:text-[#60A5FA]" size={18} />
              <span className="font-black text-[#1E293B] dark:text-[#F1F5F9] text-sm tracking-tight">{format(new Date(), "MMMM dd, yyyy")}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <StatBox label="Daily Quota" value={appointments.length.toString()} icon={<User />} color="text-[#3B82F6] dark:text-[#60A5FA]" />
          <StatBox label="Successful Visits" value={completedCount.toString()} icon={<Activity />} color="text-[#10B981] dark:text-[#34D399]" />
          <StatBox label="Pending Sync" value={remainingCount.toString()} icon={<Clock />} color="text-[#F59E0B] dark:text-[#FBBF24]" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Timeline View */}
          <div className="lg:col-span-3 bg-white dark:bg-[#1E293B] p-10 rounded-[3rem] border border-[#E2E8F0] dark:border-[#334155] shadow-sm relative overflow-hidden transition-colors duration-500">
             <div className="flex items-center justify-between mb-10">
                <h2 className="text-2xl font-black text-[#1E293B] dark:text-[#F1F5F9] tracking-tight">Active Schedule</h2>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#3B82F6] dark:bg-[#60A5FA] rounded-full animate-pulse" />
                  <span className="text-[10px] font-black text-[#64748B] dark:text-[#94A3B8] uppercase tracking-widest">Real-time sync</span>
                </div>
             </div>

             <div className="space-y-4">
                {appointments.length === 0 ? (
                  <div className="text-center py-20 bg-[#F8FAFC] dark:bg-[#0F172A] rounded-[2rem] border-2 border-dashed border-[#E2E8F0] dark:border-[#334155]">
                    <p className="text-[#64748B] dark:text-[#94A3B8] font-bold italic">No upcoming patients queued.</p>
                  </div>
                ) : (
                  appointments.map((appt) => (
                    <div key={appt.id} className="group flex items-center gap-8 p-6 rounded-[2.5rem] bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] hover:border-[#3B82F6] dark:hover:border-[#60A5FA] hover:shadow-2xl hover:shadow-blue-500/5 transition-all duration-500">
                       <div className="text-center min-w-[80px]">
                          <p className="text-[10px] font-black text-[#64748B] dark:text-[#94A3B8] uppercase tracking-widest">{format(appt.dateTime, "MMM dd")}</p>
                          <p className="text-2xl font-black text-[#1E293B] dark:text-[#F1F5F9] leading-none my-1">{format(appt.dateTime, "HH:mm")}</p>
                       </div>
                       <div className="w-1.5 h-12 bg-[#F8FAFC] dark:bg-[#0F172A] rounded-full group-hover:bg-[#3B82F6] dark:group-hover:bg-[#60A5FA] transition-colors" />
                       <div className="flex-1">
                          <p className="text-[10px] font-black text-[#64748B] dark:text-[#94A3B8] uppercase tracking-widest mb-1">Patient Encounter</p>
                          <h4 className="text-xl font-black text-[#1E293B] dark:text-[#F1F5F9]">{appt.patient.user.name}</h4>
                       </div>
                       <div className="flex items-center gap-4">
                          <Badge className={cn(
                            "rounded-full px-4 py-1.5 font-black text-[10px] uppercase tracking-widest border-none shadow-sm",
                            appt.status === "SCHEDULED" ? "bg-blue-50 dark:bg-blue-900/20 text-[#3B82F6] dark:text-[#60A5FA]" : "bg-green-50 dark:bg-green-900/20 text-[#10B981] dark:text-[#34D399]"
                          )}>
                            {appt.status}
                          </Badge>
                          <Link href={`/dashboard/doctor/appointments/${appt.id}`}>
                            <button className="p-4 bg-[#1E293B] dark:bg-[#0F172A] text-white rounded-[1.5rem] hover:bg-[#3B82F6] dark:hover:bg-[#60A5FA] transition-all shadow-xl shadow-slate-200 dark:shadow-none">
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
             <div className="bg-[#1E293B] dark:bg-[#1E293B] p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group transition-all duration-500">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#3B82F6] rounded-full blur-[60px] opacity-20 group-hover:scale-150 transition-transform duration-700" />
                <h3 className="text-2xl font-black mb-6 tracking-tight">Active Duty</h3>
                <div className="space-y-6">
                   <div>
                      <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest mb-2">Primary Specialization</p>
                      <p className="text-lg font-black text-[#60A5FA]">{doctor?.specialization}</p>
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest mb-2">Shift Progress</p>
                      <div className="w-full h-1.5 bg-white/5 rounded-full mt-3 overflow-hidden">
                         <div className="h-full bg-[#3B82F6] rounded-full" style={{ width: `${(completedCount / (appointments.length || 1)) * 100}%` }} />
                      </div>
                   </div>
                </div>
                <Link href="/dashboard/doctor/patients">
                  <button className="w-full mt-10 py-4 bg-[#3B82F6] hover:bg-[#2563EB] rounded-2xl font-black text-xs uppercase tracking-widest transition-all">
                     Patient History Search
                  </button>
                </Link>
             </div>

             <div className="bg-white dark:bg-[#1E293B] p-8 rounded-[2.5rem] border border-[#E2E8F0] dark:border-[#334155] text-center transition-colors duration-500">
                <div className="w-12 h-12 bg-green-50 dark:bg-green-900/10 text-[#10B981] dark:text-[#34D399] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ExternalLink size={20} />
                </div>
                <h4 className="font-black text-[#1E293B] dark:text-[#F1F5F9] mb-1">Global Drug Index</h4>
                <p className="text-xs font-medium text-[#64748B] dark:text-[#94A3B8]">Access interactions and dosing</p>
             </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatBox({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-white dark:bg-[#1E293B] p-8 rounded-[2.5rem] border border-[#E2E8F0] dark:border-[#334155] flex items-center justify-between group hover:border-[#3B82F6] dark:hover:border-[#60A5FA] transition-all shadow-sm transition-colors duration-500">
       <div>
          <p className="text-[10px] font-black text-[#64748B] dark:text-[#94A3B8] uppercase tracking-widest mb-1">{label}</p>
          <p className="text-4xl font-black text-[#1E293B] dark:text-[#F1F5F9] tracking-tighter">{value}</p>
       </div>
       <div className={cn("w-14 h-14 rounded-2xl bg-[#F8FAFC] dark:bg-[#0F172A] flex items-center justify-center group-hover:scale-110 transition-transform", color)}>
          {React.cloneElement(icon as React.ReactElement, { size: 28 })}
       </div>
    </div>
  );
}
