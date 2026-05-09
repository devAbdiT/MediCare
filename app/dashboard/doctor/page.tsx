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
      dateTime: { gte: today, lt: tomorrow },
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
              <div className="w-2 h-8 bg-indigo-600 rounded-full" />
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Clinical Workspace</h1>
            </div>
            <p className="text-slate-500 text-lg font-medium">Monitoring {appointments.length} active consultations today.</p>
          </div>
          <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
            <div className="px-5 py-3 bg-slate-50 rounded-xl flex items-center gap-3">
              <Calendar className="text-indigo-600" size={18} />
              <span className="font-black text-slate-900 text-sm tracking-tight">{format(new Date(), "MMMM dd, yyyy")}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <StatBox label="Daily Quota" value={appointments.length.toString()} icon={<User />} color="text-indigo-600" />
          <StatBox label="Successful Visits" value={completedCount.toString()} icon={<Activity />} color="text-emerald-500" />
          <StatBox label="Pending Sync" value={remainingCount.toString()} icon={<Clock />} color="text-amber-500" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Timeline View */}
          <div className="lg:col-span-3 bg-white p-10 rounded-[3rem] border border-slate-200/60 shadow-sm relative overflow-hidden">
             <div className="flex items-center justify-between mb-10">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Active Schedule</h2>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Real-time sync</span>
                </div>
             </div>

             <div className="space-y-4">
                {appointments.length === 0 ? (
                  <div className="text-center py-20 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-100">
                    <p className="text-slate-400 font-bold italic">No patients queued for today.</p>
                  </div>
                ) : (
                  appointments.map((appt) => (
                    <div key={appt.id} className="group flex items-center gap-8 p-6 rounded-[2.5rem] bg-white border border-slate-100 hover:border-indigo-500 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-500">
                       <div className="text-center min-w-[80px]">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{format(appt.dateTime, "aaa")}</p>
                          <p className="text-2xl font-black text-slate-900 leading-none my-1">{format(appt.dateTime, "HH:mm")}</p>
                       </div>
                       <div className="w-1.5 h-12 bg-slate-100 rounded-full group-hover:bg-indigo-600 transition-colors" />
                       <div className="flex-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Patient Encounter</p>
                          <h4 className="text-xl font-black text-slate-900">{appt.patient.user.name}</h4>
                       </div>
                       <div className="flex items-center gap-4">
                          <Badge className={cn(
                            "rounded-full px-4 py-1.5 font-black text-[10px] uppercase tracking-widest border-none shadow-sm",
                            appt.status === "SCHEDULED" ? "bg-indigo-50 text-indigo-600" : "bg-emerald-50 text-emerald-600"
                          )}>
                            {appt.status}
                          </Badge>
                          <Link href={`/dashboard/doctor/appointments/${appt.id}`}>
                            <button className="p-4 bg-slate-900 text-white rounded-[1.5rem] hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200">
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
             <div className="bg-[#0A0D14] p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600 rounded-full blur-[60px] opacity-20 group-hover:scale-150 transition-transform duration-700" />
                <h3 className="text-2xl font-black mb-6 tracking-tight">Active Duty</h3>
                <div className="space-y-6">
                   <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Primary Specialization</p>
                      <p className="text-lg font-black text-indigo-400">{doctor?.specialization}</p>
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Shift Progress</p>
                      <div className="w-full h-1.5 bg-white/5 rounded-full mt-3 overflow-hidden">
                         <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(completedCount / (appointments.length || 1)) * 100}%` }} />
                      </div>
                   </div>
                </div>
                <button className="w-full mt-10 py-4 bg-indigo-600 hover:bg-indigo-700 rounded-2xl font-black text-xs uppercase tracking-widest transition-all">
                   Patient History Search
                </button>
             </div>

             <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 text-center">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ExternalLink size={20} />
                </div>
                <h4 className="font-black text-slate-900 mb-1">Global Drug Index</h4>
                <p className="text-xs font-medium text-slate-400">Access interactions and dosing</p>
             </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatBox({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 flex items-center justify-between group hover:border-indigo-500 transition-all shadow-sm">
       <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
          <p className="text-4xl font-black text-slate-900 tracking-tighter">{value}</p>
       </div>
       <div className={cn("w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:scale-110 transition-transform", color)}>
          {React.cloneElement(icon as React.ReactElement, { size: 28 })}
       </div>
    </div>
  );
}
