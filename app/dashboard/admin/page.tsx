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
        <div className="bg-[#1E293B] dark:bg-[#1E293B] p-10 rounded-[2.5rem] text-white relative overflow-hidden transition-colors duration-500">
          <div className="absolute top-0 right-0 w-[500px] h-full bg-gradient-to-l from-[#3B82F6]/20 to-transparent" />
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#3B82F6]/20 rounded-full border border-[#3B82F6]/30">
                <Zap size={14} className="text-[#60A5FA] fill-[#60A5FA]" />
                <span className="text-[10px] font-black uppercase tracking-widest text-[#60A5FA]">System Performance: Optimal</span>
              </div>
              <h1 className="text-5xl font-black tracking-tighter">System Console</h1>
              <p className="text-[#94A3B8] text-lg font-medium max-w-lg">Monitoring global medical activity and infrastructure integrity across all nodes.</p>
            </div>
            <div className="flex gap-4">
              <button className="bg-[#3B82F6] hover:bg-[#2563EB] dark:bg-[#60A5FA] dark:hover:bg-[#3B82F6] text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-blue-500/20">
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
          <div className="lg:col-span-2 bg-white dark:bg-[#1E293B] p-10 rounded-[3rem] border border-[#E2E8F0] dark:border-[#334155] shadow-sm transition-colors duration-500">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-2xl font-black text-[#1E293B] dark:text-[#F1F5F9] tracking-tight flex items-center gap-3">
                System Activity Trail
              </h2>
              <button className="text-[#3B82F6] dark:text-[#60A5FA] text-[10px] font-black uppercase tracking-widest border-b-2 border-[#3B82F6]/10 dark:border-[#60A5FA]/10 hover:border-[#3B82F6] dark:hover:border-[#60A5FA] transition-all">
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
             <div className="bg-[#3B82F6] dark:bg-[#3B82F6] p-8 rounded-[2.5rem] text-white shadow-2xl shadow-blue-500/20 group transition-all duration-500">
                <div className="flex items-center justify-between mb-8">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                    <ArrowUpRight size={24} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-60">High Priority</span>
                </div>
                <h3 className="text-2xl font-black mb-2">Pending Verifications</h3>
                <p className="text-blue-100 text-sm font-medium mb-8">4 medical licenses require immediate manual review.</p>
                <button className="w-full py-4 bg-white text-[#3B82F6] rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#F8FAFC] transition-all">
                  Open Review Queue
                </button>
             </div>

             <div className="bg-white dark:bg-[#1E293B] p-8 rounded-[2.5rem] border border-[#E2E8F0] dark:border-[#334155] text-center transition-colors duration-500">
                <p className="text-[10px] font-black text-[#64748B] dark:text-[#94A3B8] uppercase tracking-[0.2em] mb-2">Build Version</p>
                <p className="text-[#1E293B] dark:text-[#F1F5F9] font-black">MediCare Enterprise v2.4.0</p>
             </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function AdminStat({ icon, label, value, trend }: { icon: React.ReactNode; label: string; value: string; trend: string }) {
  return (
    <div className="bg-white dark:bg-[#1E293B] p-8 rounded-[2.5rem] border border-[#E2E8F0] dark:border-[#334155] group hover:border-[#3B82F6] dark:hover:border-[#60A5FA] transition-all duration-500 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="w-12 h-12 bg-[#F8FAFC] dark:bg-[#0F172A] rounded-2xl flex items-center justify-center text-[#64748B] dark:text-[#94A3B8] group-hover:bg-[#3B82F6]/10 dark:group-hover:bg-[#60A5FA]/10 group-hover:text-[#3B82F6] dark:group-hover:text-[#60A5FA] transition-colors">
          {icon}
        </div>
        <span className="text-xs font-black text-[#3B82F6] dark:text-[#60A5FA]">{trend}</span>
      </div>
      <p className="text-[10px] font-black text-[#64748B] dark:text-[#94A3B8] uppercase tracking-widest mb-1">{label}</p>
      <p className="text-4xl font-black text-[#1E293B] dark:text-[#F1F5F9] tracking-tighter">{value}</p>
    </div>
  );
}

function LogItem({ type, text, time }: { type: string; text: string; time: string }) {
  return (
    <div className="flex items-center gap-6 p-4 rounded-2xl hover:bg-[#F8FAFC] dark:hover:bg-[#0F172A] transition-colors border border-transparent hover:border-[#E2E8F0] dark:hover:border-[#334155]">
      <span className="w-10 text-[10px] font-black text-[#3B82F6] dark:text-[#60A5FA] uppercase tracking-widest">{type}</span>
      <p className="flex-1 text-sm font-bold text-[#1E293B] dark:text-[#F1F5F9] leading-tight">{text}</p>
      <span className="text-[10px] font-black text-[#64748B] dark:text-[#94A3B8] uppercase tracking-widest">{time}</span>
    </div>
  );
}
