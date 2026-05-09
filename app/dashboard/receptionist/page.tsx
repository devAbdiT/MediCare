// app/dashboard/receptionist/page.tsx
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import prisma from "@/lib/prisma";
import { format } from "date-fns";
import { Calendar, UserPlus, ChevronRight, Search, Activity } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

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
             <div className="w-1.5 h-10 bg-indigo-600 rounded-full" />
             <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Front Desk Control</h1>
                <p className="text-slate-500 font-medium">Operational Hub for Patient Flow</p>
             </div>
          </div>
          <div className="flex gap-4 w-full lg:w-auto">
             <Link href="/dashboard/receptionist/register" className="flex-1 lg:flex-none">
                <button className="w-full bg-[#0A0D14] text-white px-10 py-5 rounded-[1.5rem] font-black shadow-2xl shadow-slate-200 hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 text-sm uppercase tracking-widest">
                  <UserPlus size={20} />
                  Register Patient
                </button>
             </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <ReceptionStat label="Daily Manifest" value={appointments.length.toString()} icon={<Activity />} />
           <ReceptionStat label="Clinic Utilization" value="78%" icon={<Search />} />
           <ReceptionStat label="Global Database" value={patientCount.toString()} icon={<UserPlus />} />
        </div>

        <div className="bg-white rounded-[3rem] border border-slate-200/60 shadow-sm overflow-hidden">
           <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                 Live Patient Manifest
              </h2>
              <div className="flex items-center gap-2 px-5 py-2.5 bg-white rounded-2xl border border-slate-100 shadow-sm">
                 <span className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" />
                 <span className="text-xs font-black text-slate-900 uppercase tracking-widest">{format(new Date(), "dd MMM yyyy")}</span>
              </div>
           </div>

           <div className="p-10">
              {appointments.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-100">
                  <p className="text-slate-400 font-bold italic">No arrivals scheduled for today.</p>
                </div>
              ) : (
                <div className="space-y-4">
                   {appointments.map((appt) => (
                     <div key={appt.id} className="group p-6 rounded-[2.5rem] bg-white border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-8 hover:border-indigo-500 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-500">
                        <div className="flex items-center gap-8 w-full md:w-auto">
                           <div className="bg-indigo-600 text-white p-6 rounded-[1.5rem] text-center min-w-[100px] shadow-xl shadow-indigo-100 group-hover:bg-[#0A0D14] transition-colors duration-500">
                              <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Entry</p>
                              <p className="text-2xl font-black">{format(appt.dateTime, "HH:mm")}</p>
                           </div>
                           <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Patient Name</p>
                              <h4 className="text-2xl font-black text-slate-900">{appt.patient.user.name}</h4>
                              <p className="text-xs font-bold text-indigo-500 mt-1 uppercase tracking-widest">→ Dr. {appt.doctor.user.name}</p>
                           </div>
                        </div>

                        <div className="flex items-center gap-6 w-full md:w-auto justify-end border-t md:border-t-0 pt-6 md:pt-0 border-slate-50">
                           <div className="text-right">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Clinic Status</p>
                              <span className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-600">
                                 <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                 CHECKED IN
                              </span>
                           </div>
                           <button className="p-5 bg-slate-50 text-slate-400 rounded-2xl hover:bg-[#0A0D14] hover:text-white transition-all shadow-sm">
                              <ChevronRight size={24} />
                           </button>
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
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 flex items-center justify-between group hover:border-indigo-500 transition-all shadow-sm">
       <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
          <p className="text-4xl font-black text-slate-900 tracking-tighter">{value}</p>
       </div>
       <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
          {React.cloneElement(icon as React.ReactElement, { size: 24 })}
       </div>
    </div>
  );
}
