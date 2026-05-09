// app/dashboard/admin/page.tsx
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import prisma from "@/lib/prisma";
import { Users, Calendar, Activity, Zap, ArrowUpRight } from "lucide-react";

export default async function AdminDashboard() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session || (session.user as any).role !== "ADMIN") {
    redirect("/login");
  }

  const [patientCount, appointmentTodayCount, doctorCount, userCount] = await Promise.all([
    prisma.patient.count(),
    prisma.appointment.count({
      where: {
        dateTime: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lt: new Date(new Date().setHours(23, 59, 59, 999)),
        }
      }
    }),
    prisma.doctor.count(),
    prisma.user.count()
  ]);

  return (
    <DashboardLayout role="admin">
      <div className="space-y-10 pb-10">
        {/* Top Header Card */}
        <div className="bg-[#0A0D14] p-10 rounded-[2.5rem] text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-full bg-gradient-to-l from-indigo-600/20 to-transparent" />
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 rounded-full border border-indigo-500/30">
                <Zap size={14} className="text-indigo-400 fill-indigo-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">System Performance: Optimal</span>
              </div>
              <h1 className="text-5xl font-black tracking-tighter">System Console</h1>
              <p className="text-slate-400 text-lg font-medium max-w-lg">Monitoring global medical activity and infrastructure integrity across all nodes.</p>
            </div>
            <div className="flex gap-4">
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/20">
                Generate Audit
              </button>
              <button className="bg-white/5 hover:bg-white/10 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest border border-white/10 transition-all">
                API Docs
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <AdminStat icon={<Users />} label="Total Patients" value={patientCount.toString()} trend="+12.5%" />
          <AdminStat icon={<Calendar />} label="Today's Visits" value={appointmentTodayCount.toString()} trend="+3.2%" />
          <AdminStat icon={<Activity />} label="Staff Online" value={doctorCount.toString()} trend="Active" />
          <AdminStat icon={<Zap />} label="Server Uptime" value="99.9%" trend="Stable" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Logs */}
          <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-slate-200/60 shadow-sm">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                System Activity Trail
              </h2>
              <button className="text-indigo-600 text-[10px] font-black uppercase tracking-widest border-b-2 border-indigo-100 hover:border-indigo-600 transition-all">
                View Full Logs
              </button>
            </div>
            <div className="space-y-4">
              <LogItem type="USER" text="New Receptionist account created: receptionist_delta" time="2m ago" />
              <LogItem type="SEC" text="Database sync completed with node EU-WEST" time="15m ago" />
              <LogItem type="PAT" text="Global patient index updated (+42 records)" time="1h ago" />
              <LogItem type="SYS" text="Automated security patch v2.41 applied" time="3h ago" />
            </div>
          </div>

          {/* Quick Access */}
          <div className="space-y-6">
             <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-100 group">
                <div className="flex items-center justify-between mb-8">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                    <ArrowUpRight size={24} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-60">High Priority</span>
                </div>
                <h3 className="text-2xl font-black mb-2">Pending Verifications</h3>
                <p className="text-indigo-100 text-sm font-medium mb-8">4 medical licenses require immediate manual review.</p>
                <button className="w-full py-4 bg-white text-indigo-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all">
                  Open Review Queue
                </button>
             </div>

             <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Build Version</p>
                <p className="text-slate-900 font-black">MediCare Enterprise v2.4.0</p>
             </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function AdminStat({ icon, label, value, trend }: { icon: React.ReactNode; label: string; value: string; trend: string }) {
  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 group hover:border-indigo-500 transition-all duration-500 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
          {icon}
        </div>
        <span className="text-xs font-black text-indigo-500">{trend}</span>
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-4xl font-black text-slate-900 tracking-tighter">{value}</p>
    </div>
  );
}

function LogItem({ type, text, time }: { type: string; text: string; time: string }) {
  return (
    <div className="flex items-center gap-6 p-4 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
      <span className="w-10 text-[10px] font-black text-indigo-500 uppercase tracking-widest">{type}</span>
      <p className="flex-1 text-sm font-bold text-slate-600">{text}</p>
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{time}</span>
    </div>
  );
}
