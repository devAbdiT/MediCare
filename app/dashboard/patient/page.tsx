// app/dashboard/patient/page.tsx
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { format } from "date-fns";
import { Calendar, HeartPulse, ShieldCheck, ArrowRight, Activity, Plus } from "lucide-react";

export default async function PatientDashboard() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session || (session.user as any).role !== "PATIENT") {
    redirect("/login");
  }

  const patient = await prisma.patient.findUnique({
    where: { userId: session.user.id }
  });

  const appointments = await prisma.appointment.findMany({
    where: {
      patientId: patient?.id,
      dateTime: { gte: new Date() },
      status: "SCHEDULED"
    },
    include: {
      doctor: { include: { user: { select: { name: true } } } }
    },
    orderBy: { dateTime: "asc" }
  });

  const latestRecord = await prisma.medicalRecord.findFirst({
    where: { patientId: patient?.id },
    orderBy: { date: "desc" }
  });

  return (
    <DashboardLayout role="patient">
      <div className="space-y-10 pb-10">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">My Health Hub</h1>
            <p className="text-slate-500 text-lg font-medium mt-1">Status: <span className="text-emerald-500 font-black uppercase tracking-widest text-xs">All Systems Syncing</span></p>
          </div>
          <Link href="/dashboard/patient/book">
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-5 rounded-[1.5rem] font-black shadow-2xl shadow-indigo-100 flex items-center gap-3 text-sm uppercase tracking-widest transition-all">
              <Plus size={20} />
              New Consultation
            </button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Appointments Feed */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-10 rounded-[3rem] border border-slate-200/60 shadow-sm">
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                  Upcoming Visits
                </h2>
                <Badge className="bg-slate-100 text-slate-500 rounded-full px-4 py-1.5 font-black text-[10px] uppercase tracking-widest">
                  {appointments.length} Pending
                </Badge>
              </div>

              {appointments.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-100">
                  <Calendar size={48} className="mx-auto text-slate-200 mb-4" />
                  <p className="text-slate-400 font-bold">No visits scheduled.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {appointments.map((appt) => (
                    <div key={appt.id} className="p-6 rounded-[2.5rem] bg-white border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6 hover:border-indigo-500 transition-all group">
                      <div className="flex items-center gap-8">
                        <div className="bg-[#0A0D14] text-white p-6 rounded-[1.5rem] text-center min-w-[100px] shadow-xl group-hover:bg-indigo-600 transition-colors">
                          <p className="text-[10px] font-black uppercase tracking-widest opacity-40">{format(appt.dateTime, "MMM")}</p>
                          <p className="text-3xl font-black leading-none my-1">{format(appt.dateTime, "dd")}</p>
                          <p className="text-xs font-bold opacity-60">{format(appt.dateTime, "HH:mm")}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Assigned Specialist</p>
                          <h4 className="text-xl font-black text-slate-900">Dr. {appt.doctor.user.name}</h4>
                          <div className="flex items-center gap-2 mt-2">
                             <div className="w-2 h-2 bg-indigo-500 rounded-full" />
                             <span className="text-xs font-bold text-slate-500">Clinical Consultation</span>
                          </div>
                        </div>
                      </div>
                      <button className="text-slate-400 hover:text-red-500 transition-colors p-4">
                        <ArrowRight size={24} className="rotate-45" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Health Summary Panel */}
          <div className="space-y-8">
             <div className="bg-white p-10 rounded-[3rem] border border-slate-200/60 shadow-sm group">
                <div className="flex items-center justify-between mb-8">
                   <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                      <HeartPulse size={28} />
                   </div>
                   <Activity className="text-slate-100 group-hover:text-emerald-500 transition-colors" size={32} />
                </div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Latest Clinical Record</h3>
                {latestRecord ? (
                  <div>
                    <p className="text-2xl font-black text-slate-900 mb-1">{latestRecord.diagnosis}</p>
                    <p className="text-slate-400 text-sm font-bold mb-8 uppercase tracking-widest">{format(latestRecord.date, "MMMM dd, yyyy")}</p>
                    <Link href="/dashboard/patient/records">
                      <button className="w-full py-5 bg-[#0A0D14] text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200">
                        Enter Health Vault
                      </button>
                    </Link>
                  </div>
                ) : (
                  <p className="text-slate-400 font-bold italic">No records indexed yet.</p>
                )}
             </div>

             <div className="bg-indigo-600 p-10 rounded-[3rem] text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-[40px]" />
                <div className="flex justify-between items-start mb-6">
                  <ShieldCheck size={32} className="text-indigo-200" />
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Verified Identity</span>
                </div>
                <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-1">Patient ID</p>
                <p className="text-3xl font-black tracking-tighter">#PAT-{session.user.id.slice(-6).toUpperCase()}</p>
                <div className="mt-8 flex gap-2">
                   {[1,2,3,4].map(i => <div key={i} className="w-2 h-2 bg-white/20 rounded-full" />)}
                </div>
             </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center justify-center", className)}>
      {children}
    </span>
  );
}
