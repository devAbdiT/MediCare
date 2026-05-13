// app/dashboard/receptionist/page.tsx
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import prisma from "@/lib/prisma";
import { format } from "date-fns";
import { Calendar, UserPlus, ChevronRight, Search, Activity } from "lucide-react";
import Link from "next/link";
import React from "react";
import { cn } from "@/lib/utils";
import AppointmentActions from "./AppointmentActions";
import { ReceptionistDashboardSearch } from "./ReceptionistDashboardSearch";

export default async function ReceptionistDashboard() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session || (session.user as any).role !== "RECEPTIONIST") {
    redirect("/login");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const appointments = await prisma.appointment.findMany({
    where: {
      dateTime: { gte: today, lt: tomorrow },
      status: { not: "CANCELLED" }
    },
    include: {
      patient: { include: { user: { select: { name: true } } } },
      doctor: { include: { user: { select: { name: true } } } }
    },
    orderBy: { dateTime: "asc" }
  });

  const patientCount = await prisma.patient.count();

  return (
    <DashboardLayout role="receptionist">
      <div className="space-y-10 pb-10">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex items-center gap-4">
             <div className="w-1.5 h-10 bg-[#3B82F6] dark:bg-[#60A5FA] rounded-full" />
             <div>
                <h1 className="text-4xl font-black text-[#1E293B] dark:text-[#F1F5F9] tracking-tighter">Front Desk Control</h1>
                <p className="text-[#64748B] dark:text-[#94A3B8] font-medium">Operational Hub for Patient Flow</p>
             </div>
          </div>
          <div className="flex gap-4 w-full lg:w-auto">
             <Link href="/dashboard/receptionist/book-appointment" className="flex-1 lg:flex-none">
                <button className="w-full bg-[#3B82F6] dark:bg-[#60A5FA] text-white px-10 py-5 rounded-[1.5rem] font-black shadow-2xl shadow-blue-500/20 hover:bg-blue-600 transition-all flex items-center justify-center gap-3 text-sm uppercase tracking-widest">
                  <Calendar size={20} />
                  Book Appointment
                </button>
             </Link>
             <Link href="/dashboard/receptionist/register" className="flex-1 lg:flex-none">
                <button className="w-full bg-[#1E293B] dark:bg-[#0F172A] text-white px-10 py-5 rounded-[1.5rem] font-black shadow-2xl shadow-slate-900/10 hover:bg-slate-800 transition-all flex items-center justify-center gap-3 text-sm uppercase tracking-widest">
                  <UserPlus size={20} />
                  Register Patient
                </button>
             </Link>
          </div>
        </div>

        <ReceptionistDashboardSearch />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <ReceptionStat label="Daily Manifest" value={appointments.length.toString()} icon={<Activity />} />
           <ReceptionStat label="Clinic Utilization" value="78%" icon={<Search />} />
           <ReceptionStat label="Global Database" value={patientCount.toString()} icon={<UserPlus />} />
        </div>

        <div className="bg-white dark:bg-[#1E293B] rounded-[3rem] border border-[#E2E8F0] dark:border-[#334155] shadow-sm overflow-hidden transition-colors duration-500">
           <div className="p-10 border-b border-[#E2E8F0] dark:border-[#334155] flex items-center justify-between bg-[#F8FAFC] dark:bg-[#0F172A]">
              <h2 className="text-2xl font-black text-[#1E293B] dark:text-[#F1F5F9] tracking-tight flex items-center gap-3">
                 Live Patient Manifest
              </h2>
              <div className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-[#1E293B] rounded-2xl border border-[#E2E8F0] dark:border-[#334155] shadow-sm transition-colors duration-500">
                 <span className="w-2 h-2 bg-[#3B82F6] dark:bg-[#60A5FA] rounded-full animate-pulse" />
                 <span className="text-xs font-black text-[#1E293B] dark:text-[#F1F5F9] uppercase tracking-widest">{format(new Date(), "dd MMM yyyy")}</span>
              </div>
           </div>

           <div className="p-10">
              {appointments.length === 0 ? (
                <div className="text-center py-20 bg-[#F8FAFC] dark:bg-[#0F172A] rounded-[2.5rem] border-2 border-dashed border-[#E2E8F0] dark:border-[#334155]">
                  <p className="text-[#64748B] dark:text-[#94A3B8] font-bold italic">No arrivals scheduled for today.</p>
                </div>
              ) : (
                <div className="space-y-4">
                   {appointments.map((appt) => (
                     <div key={appt.id} className="group p-6 rounded-[2.5rem] bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] flex flex-col md:flex-row items-center justify-between gap-8 hover:border-[#3B82F6] dark:hover:border-[#60A5FA] transition-all duration-500">
                        <div className="flex items-center gap-8 w-full md:w-auto">
                           <div className="bg-[#1E293B] dark:bg-[#0F172A] text-white p-6 rounded-[1.5rem] text-center min-w-[100px] shadow-xl group-hover:bg-[#3B82F6] dark:group-hover:bg-[#60A5FA] transition-colors duration-500">
                              <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Entry</p>
                              <p className="text-2xl font-black">{format(appt.dateTime, "HH:mm")}</p>
                           </div>
                           <div>
                              <p className="text-[10px] font-black text-[#64748B] dark:text-[#94A3B8] uppercase tracking-widest mb-1">Patient Name</p>
                              <h4 className="text-2xl font-black text-[#1E293B] dark:text-[#F1F5F9]">{appt.patient.user.name}</h4>
                              <p className="text-xs font-bold text-[#3B82F6] dark:text-[#60A5FA] mt-1 uppercase tracking-widest">→ Dr. {appt.doctor.user.name}</p>
                           </div>
                        </div>

                        <div className="flex items-center gap-6 w-full md:w-auto justify-end border-t md:border-t-0 pt-6 md:pt-0 border-[#E2E8F0] dark:border-[#334155]">
                           <div className="text-right">
                              <p className="text-[10px] font-black text-[#64748B] dark:text-[#94A3B8] uppercase tracking-widest mb-1">Clinic Status</p>
                              <span className="inline-flex items-center gap-1.5 text-xs font-black text-[#10B981] dark:text-[#34D399]">
                                 <div className="w-1.5 h-1.5 bg-[#10B981] dark:bg-[#34D399] rounded-full" />
                                 CHECKED IN
                              </span>
                           </div>
                           <AppointmentActions appointmentId={appt.id} />
                        </div>
                     </div>
                   ))}
                </div>
              )}
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function ReceptionStat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-[#1E293B] p-8 rounded-[2.5rem] border border-[#E2E8F0] dark:border-[#334155] flex items-center justify-between group hover:border-[#3B82F6] dark:hover:border-[#60A5FA] transition-all shadow-sm transition-colors duration-500">
       <div>
          <p className="text-[10px] font-black text-[#64748B] dark:text-[#94A3B8] uppercase tracking-widest mb-1">{label}</p>
          <p className="text-4xl font-black text-[#1E293B] dark:text-[#F1F5F9] tracking-tighter">{value}</p>
       </div>
       <div className="w-14 h-14 rounded-2xl bg-[#F8FAFC] dark:bg-[#0F172A] flex items-center justify-center text-[#64748B] dark:text-[#94A3B8] group-hover:bg-[#3B82F6]/10 dark:group-hover:bg-[#60A5FA]/10 group-hover:text-[#3B82F6] dark:group-hover:text-[#60A5FA] transition-all">
          {React.cloneElement(icon as React.ReactElement, { size: 24 } as any)}
       </div>
    </div>
  );
}
