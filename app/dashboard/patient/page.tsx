// app/dashboard/patient/page.tsx
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { format } from "date-fns";
import { Calendar, HeartPulse, ShieldCheck, ArrowRight, Activity, Plus, Hash } from "lucide-react";
import { cn } from "@/lib/utils";
import CancelAppointment from "./CancelAppointment";
import PrintAppointmentButton from "@/components/PrintAppointmentButton";

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
      status: { in: ["SCHEDULED", "CHECKED_IN"] }
    },
    include: {
      doctor: { include: { user: { select: { name: true } }, department: true } },
      patient: { include: { user: true } }
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
            <h1 className="text-4xl font-black text-[#1E293B] dark:text-[#F1F5F9] tracking-tighter">My Health Hub</h1>
            <p className="text-[#64748B] dark:text-[#94A3B8] text-lg font-medium mt-1">Status: <span className="text-[#10B981] dark:text-[#34D399] font-black uppercase tracking-widest text-xs">All Systems Syncing</span></p>
          </div>
          <Link href="/dashboard/patient/book">
            <button className="bg-[#3B82F6] hover:bg-[#2563EB] dark:bg-[#60A5FA] dark:hover:bg-[#3B82F6] text-white px-10 py-5 rounded-[1.5rem] font-black shadow-2xl shadow-blue-500/10 flex items-center gap-3 text-sm uppercase tracking-widest transition-all">
              <Plus size={20} />
              New Consultation
            </button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Appointments Feed */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-[#1E293B] p-10 rounded-[3rem] border border-[#E2E8F0] dark:border-[#334155] shadow-sm transition-colors duration-500">
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-2xl font-black text-[#1E293B] dark:text-[#F1F5F9] tracking-tight flex items-center gap-3">
                  Upcoming Visits
                </h2>
                <Badge className="bg-[#F8FAFC] dark:bg-[#0F172A] text-[#64748B] dark:text-[#94A3B8] rounded-full px-4 py-1.5 font-black text-[10px] uppercase tracking-widest">
                  {appointments.length} Pending
                </Badge>
              </div>

              {appointments.length === 0 ? (
                <div className="text-center py-20 bg-[#F8FAFC] dark:bg-[#0F172A] rounded-[2.5rem] border-2 border-dashed border-[#E2E8F0] dark:border-[#334155]">
                  <Calendar size={48} className="mx-auto text-[#E2E8F0] dark:text-[#334155] mb-4" />
                  <p className="text-[#64748B] dark:text-[#94A3B8] font-bold">No visits scheduled.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {appointments.map((appt) => (
                    <div key={appt.id} className={cn(
                      "p-6 rounded-[2.5rem] bg-white dark:bg-[#1E293B] border flex flex-col sm:flex-row items-center justify-between gap-6 transition-all group",
                      appt.status === "CHECKED_IN"
                        ? "border-emerald-300 dark:border-emerald-700 hover:border-emerald-400 shadow-sm shadow-emerald-100 dark:shadow-none"
                        : "border-[#E2E8F0] dark:border-[#334155] hover:border-[#3B82F6] dark:hover:border-[#60A5FA]"
                    )}>
                      <div className="flex items-center gap-8">
                        <div className={cn(
                          "text-white p-6 rounded-[1.5rem] text-center min-w-[100px] shadow-xl transition-colors",
                          appt.status === "CHECKED_IN"
                            ? "bg-emerald-600 dark:bg-emerald-700 group-hover:bg-emerald-500"
                            : "bg-[#1E293B] dark:bg-[#0F172A] group-hover:bg-[#3B82F6] dark:group-hover:bg-[#60A5FA]"
                        )}>
                          <p className="text-[10px] font-black uppercase tracking-widest opacity-40">{format(appt.dateTime, "MMM")}</p>
                          <p className="text-3xl font-black leading-none my-1">{format(appt.dateTime, "dd")}</p>
                          <p className="text-xs font-bold opacity-60">{format(appt.dateTime, "HH:mm")}</p>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-[10px] font-black text-[#64748B] dark:text-[#94A3B8] uppercase tracking-widest">Assigned Specialist</p>
                            {appt.status === "CHECKED_IN" && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-lg text-[10px] font-black text-emerald-700 dark:text-emerald-400">
                                ✓ Checked In{(appt as any).queueNumber ? ` · Q${(appt as any).queueNumber}` : ""}
                              </span>
                            )}
                          </div>
                          <h4 className="text-xl font-black text-[#1E293B] dark:text-[#F1F5F9]">Dr. {appt.doctor.user.name}</h4>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className={cn(
                              "text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border",
                              appt.appointmentType === "NEW_VISIT" && "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900",
                              appt.appointmentType === "FOLLOW_UP" && "bg-teal-50 text-teal-700 border-teal-100 dark:bg-teal-900/20 dark:text-teal-400 dark:border-teal-900",
                              appt.appointmentType === "CONSULTATION" && "bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-900",
                              appt.appointmentType === "EMERGENCY" && "bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900"
                            )}>
                              {appt.appointmentType.replace("_", " ")}
                            </span>
                            <span className={cn(
                              "text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg",
                              appt.priority === "NORMAL" && "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
                              appt.priority === "URGENT" && "bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
                              appt.priority === "EMERGENCY" && "bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800 animate-pulse font-black"
                            )}>
                              {appt.priority}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <PrintAppointmentButton appointment={appt} variant="ghost" />
                        {appt.status === "SCHEDULED" && <CancelAppointment appointmentId={appt.id} />}
                        {appt.status === "CHECKED_IN" && (
                          <div className="text-center px-4 py-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                            <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Status</p>
                            <p className="text-sm font-black text-emerald-700 dark:text-emerald-300 mt-0.5">Checked In</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Health Summary Panel */}
          <div className="space-y-8">
             <div className="bg-white dark:bg-[#1E293B] p-10 rounded-[3rem] border border-[#E2E8F0] dark:border-[#334155] shadow-sm group transition-colors duration-500">
                <div className="flex items-center justify-between mb-8">
                   <div className="w-14 h-14 bg-green-50 dark:bg-green-900/10 text-[#10B981] dark:text-[#34D399] rounded-2xl flex items-center justify-center">
                      <HeartPulse size={28} />
                   </div>
                   <Activity className="text-[#E2E8F0] dark:text-[#334155] group-hover:text-[#10B981] transition-colors" size={32} />
                </div>
                <h3 className="text-[10px] font-black text-[#64748B] dark:text-[#94A3B8] uppercase tracking-widest mb-2">Latest Clinical Record</h3>
                {latestRecord ? (
                  <div>
                    <p className="text-2xl font-black text-[#1E293B] dark:text-[#F1F5F9] mb-1">{latestRecord.diagnosis}</p>
                    <p className="text-[#64748B] dark:text-[#94A3B8] text-sm font-bold mb-8 uppercase tracking-widest">{format(latestRecord.date, "MMMM dd, yyyy")}</p>
                    <Link href="/dashboard/patient/records">
                      <button className="w-full py-5 bg-[#1E293B] dark:bg-[#0F172A] text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-[#3B82F6] dark:hover:bg-[#60A5FA] transition-all shadow-xl shadow-slate-200 dark:shadow-none">
                        Enter Health Vault
                      </button>
                    </Link>
                  </div>
                ) : (
                  <p className="text-[#64748B] dark:text-[#94A3B8] font-bold italic">No records indexed yet.</p>
                )}
             </div>

             <div className="bg-[#3B82F6] dark:bg-[#3B82F6] p-10 rounded-[3rem] text-white relative overflow-hidden group shadow-2xl shadow-blue-500/20 transition-all duration-500">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-[40px]" />
                <div className="flex justify-between items-start mb-6">
                  <ShieldCheck size={32} className="text-blue-100" />
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Verified Identity</span>
                </div>
                <p className="text-[10px] font-black text-blue-100 uppercase tracking-widest mb-1">Patient ID</p>
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
