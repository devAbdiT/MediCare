// app/dashboard/admin/page.tsx
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import prisma from "@/lib/prisma";
import { Users, Calendar, Activity, Zap, ArrowUpRight, BarChart2, Wallet, Banknote, Landmark, Receipt } from "lucide-react";
import { subDays, startOfDay, endOfDay, format } from "date-fns";
import AnalyticsCharts from "./AnalyticsCharts";
import RevenueChart from "./RevenueChart";
import AdminQuickActions from "./AdminQuickActions";
import AdminControls from "./AdminControls";
import Link from "next/link";

export default async function AdminDashboard() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || (session.user as any).role !== "ADMIN") {
    redirect("/login");
  }

  // Fetch Stats
  const [patientCount, appointmentTodayCount, doctorCount, userCount] =
    await Promise.all([
      prisma.patient.count(),
      prisma.appointment.count({
        where: {
          dateTime: {
            gte: startOfDay(new Date()),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      }),
      prisma.doctor.count(),
      prisma.user.count(),
    ]);

  // Fetch Analytics Data (Last 7 Days)
  const last7Days = Array.from({ length: 7 }, (_, i) =>
    subDays(new Date(), i),
  ).reverse();

  const analyticsData = await Promise.all(
    last7Days.map(async (day) => {
      const start = startOfDay(day);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);

      const [appointments, registrations] = await Promise.all([
        prisma.appointment.count({
          where: { dateTime: { gte: start, lt: end } },
        }),
        prisma.user.count({
          where: {
            role: "PATIENT",
            createdAt: { gte: start, lt: end },
          },
        }),
      ]);

      return {
        date: format(day, "MMM dd"),
        appointments,
        registrations,
      };
    }),
  );

  // --- Revenue / Billing Data ---
  const allInvoices = await prisma.invoice.aggregate({
    _sum: { totalAmount: true, paidAmount: true },
    where: { status: { notIn: ["CANCELLED", "WAIVED"] } }
  });
  const outstandingAmount = (Number(allInvoices._sum.totalAmount) || 0) - (Number(allInvoices._sum.paidAmount) || 0);

  const billingStartDate = startOfDay(subDays(new Date(), 6));
  const billingEndDate = endOfDay(new Date());

  const [recentInvoices, recentPayments] = await Promise.all([
    prisma.invoice.findMany({
      where: {
        createdAt: { gte: billingStartDate, lte: billingEndDate },
        status: { notIn: ["CANCELLED", "WAIVED"] }
      }
    }),
    prisma.payment.findMany({
      where: { receivedAt: { gte: billingStartDate, lte: billingEndDate } }
    })
  ]);

  const todayStart = startOfDay(new Date());
  
  const todayInvoices = recentInvoices.filter(inv => inv.createdAt >= todayStart);
  const todayPayments = recentPayments.filter(p => p.receivedAt >= todayStart);

  const todayInvoiced = todayInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
  const todayCollected = todayPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  const paidTodayCount = todayInvoices.filter(inv => inv.status === "PAID").length;

  const revenueChartData = last7Days.map(day => {
    const start = startOfDay(day);
    const end = endOfDay(day);
    
    const dayInvoiced = recentInvoices
      .filter(inv => inv.createdAt >= start && inv.createdAt <= end)
      .reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
      
    const dayCollected = recentPayments
      .filter(p => p.receivedAt >= start && p.receivedAt <= end)
      .reduce((sum, p) => sum + Number(p.amount), 0);

    return {
      date: format(day, "MMM dd"),
      Invoiced: dayInvoiced,
      Collected: dayCollected
    };
  });

  // Fetch recent system activity
  const [recentUsers, recentAppts] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 4 }),
    prisma.appointment.findMany({
      orderBy: { createdAt: "desc" },
      take: 4,
      include: { patient: { include: { user: true } } },
    }),
  ]);

  const recentLogs = [
    ...recentUsers.map((u) => ({
      type: "USER",
      text: `New ${u.role.toLowerCase()} account created: ${u.name}`,
      date: u.createdAt,
    })),
    ...recentAppts.map((a) => ({
      type: "APPT",
      text: `Appointment booked for ${a.patient?.user?.name || "Unknown"}`,
      date: a.createdAt,
    })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 5);

  const getRelativeTime = (date: Date) => {
    const diff = Math.floor((new Date().getTime() - date.getTime()) / 60000); // in minutes
    if (diff < 1) return "Just now";
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-10 pb-10">
        {/* Top Header Card */}
        <div className="bg-[#1A2A4A] dark:bg-[#111C3A] p-10 rounded-[2.5rem] text-white relative overflow-hidden transition-colors duration-500">
          <div className="absolute top-0 right-0 w-[500px] h-full bg-gradient-to-l from-[#1E4A8A]/20 to-transparent" />
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#1E4A8A]/20 rounded-full border border-[#1E4A8A]/30">
                <Zap size={14} className="text-[#4A8AC8] fill-[#4A8AC8]" />
                <span className="text-[10px] font-black uppercase tracking-widest text-[#4A8AC8]">
                  System Performance: Optimal
                </span>
              </div>
              <h1 className="text-5xl font-black tracking-tighter">
                System Console
              </h1>
              <p className="text-[#8A9CBA] text-lg font-medium max-w-lg">
                Monitoring global medical activity and infrastructure integrity
                across all nodes.
              </p>
            </div>
            <AdminControls />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <AdminStat
            icon={<Users />}
            label="Total Patients"
            value={patientCount.toString()}
            trend="+12.5%"
          />
          <AdminStat
            icon={<Calendar />}
            label="Today's Visits"
            value={appointmentTodayCount.toString()}
            trend="+3.2%"
          />
          <AdminStat
            icon={<Activity />}
            label="Staff Online"
            value={doctorCount.toString()}
            trend="Active"
          />
          <AdminStat
            icon={<Zap />}
            label="Server Uptime"
            value="99.9%"
            trend="Stable"
          />
        </div>

        {/* Revenue Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
          <AdminStat
            icon={<Wallet />}
            label="Today Invoiced"
            value={`ETB ${todayInvoiced.toLocaleString()}`}
            trend="Billing"
          />
          <AdminStat
            icon={<Banknote />}
            label="Today Collected"
            value={`ETB ${todayCollected.toLocaleString()}`}
            trend="Revenue"
          />
          <AdminStat
            icon={<Landmark />}
            label="Outstanding"
            value={`ETB ${outstandingAmount.toLocaleString()}`}
            trend="All Time"
          />
          <AdminStat
            icon={<Receipt />}
            label="Paid Today"
            value={`${paidTodayCount} invoices`}
            trend="Completed"
          />
        </div>

        {/* Analytics Charts Section */}
        <AnalyticsCharts data={analyticsData} />

        {/* Revenue Chart */}
        <RevenueChart data={revenueChartData} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Logs */}
          <div className="lg:col-span-2 bg-white dark:bg-[#111C3A] p-10 rounded-[3rem] border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-sm transition-colors duration-500">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-2xl font-black text-[#1A2A4A] dark:text-[#E8EEF8] tracking-tight flex items-center gap-3">
                System Activity Trail
              </h2>
              <button className="text-[#1E4A8A] dark:text-[#4A8AC8] text-[10px] font-black uppercase tracking-widest border-b-2 border-[#1E4A8A]/10 dark:border-[#4A8AC8]/10 hover:border-[#1E4A8A] dark:hover:border-[#4A8AC8] transition-all">
                View Full Logs
              </button>
            </div>
            <div className="space-y-4">
              {recentLogs.map((log, idx) => (
                <LogItem
                  key={idx}
                  type={log.type}
                  text={log.text}
                  time={getRelativeTime(log.date)}
                />
              ))}
              {recentLogs.length === 0 && (
                <p className="text-sm text-[#8A9CBA]">No recent activity.</p>
              )}
            </div>
          </div>

          {/* Quick Access */}
          <div className="space-y-6">
            <Link
              href="/dashboard/receptionist/billing"
              className="block bg-[#1E4A8A] dark:bg-[#1A3A7A] p-6 rounded-[2rem] text-white shadow-xl hover:scale-[1.02] active:scale-[0.99] transition-all duration-300 group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center group-hover:bg-white/20 transition-colors">
                  <Receipt size={20} />
                </div>
                <ArrowUpRight size={18} className="opacity-50 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
              </div>
              <h3 className="text-xl font-black mb-1">View All Invoices</h3>
              <p className="text-blue-200 text-xs font-medium">Manage pending and paid invoices.</p>
            </Link>

            <Link
              href="/dashboard/admin/reports"
              className="block bg-white dark:bg-[#111C3A] border border-[#D0DCE8] dark:border-[#1A2A4A] p-6 rounded-[2rem] shadow-sm hover:border-[#1E4A8A] dark:hover:border-[#4A8AC8] transition-all duration-300 group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 bg-[#F0F4F8] dark:bg-[#0A122A] text-[#1E4A8A] dark:text-[#4A8AC8] rounded-xl flex items-center justify-center group-hover:bg-[#1E4A8A]/10 transition-colors">
                  <BarChart2 size={20} />
                </div>
                <ArrowUpRight size={18} className="opacity-50 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all text-[#1A2A4A] dark:text-white" />
              </div>
              <h3 className="text-xl font-black mb-1 text-[#1A2A4A] dark:text-white">Full Reports</h3>
              <p className="text-[#5A6E8A] dark:text-[#8A9CBA] text-xs font-medium">Revenue, appointments, and insights.</p>
            </Link>
            
            <Link
              href="/dashboard/admin/services"
              className="block bg-white dark:bg-[#111C3A] border border-[#D0DCE8] dark:border-[#1A2A4A] p-6 rounded-[2rem] shadow-sm hover:border-[#1E4A8A] dark:hover:border-[#4A8AC8] transition-all duration-300 group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 bg-[#F0F4F8] dark:bg-[#0A122A] text-[#1E4A8A] dark:text-[#4A8AC8] rounded-xl flex items-center justify-center group-hover:bg-[#1E4A8A]/10 transition-colors">
                  <Activity size={20} />
                </div>
                <ArrowUpRight size={18} className="opacity-50 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all text-[#1A2A4A] dark:text-white" />
              </div>
              <h3 className="text-xl font-black mb-1 text-[#1A2A4A] dark:text-white">Service Catalogue</h3>
              <p className="text-[#5A6E8A] dark:text-[#8A9CBA] text-xs font-medium">Manage pricing and services.</p>
            </Link>

            {/* Version card */}
            <div className="bg-white dark:bg-[#111C3A] p-6 rounded-[2rem] border border-[#D0DCE8] dark:border-[#1A2A4A] text-center transition-colors duration-500">
              <p className="text-[10px] font-black text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-[0.2em] mb-1">Build Version</p>
              <p className="text-[#1A2A4A] dark:text-[#E8EEF8] font-black text-sm">MediCare Enterprise v2.4.0</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function AdminStat({
  icon,
  label,
  value,
  trend,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend: string;
}) {
  return (
    <div className="bg-white dark:bg-[#111C3A] p-8 rounded-[2.5rem] border border-[#D0DCE8] dark:border-[#1A2A4A] group hover:border-[#1E4A8A] dark:hover:border-[#4A8AC8] transition-all duration-500 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="w-12 h-12 bg-[#F0F4F8] dark:bg-[#0A122A] rounded-2xl flex items-center justify-center text-[#5A6E8A] dark:text-[#8A9CBA] group-hover:bg-[#1E4A8A]/10 dark:group-hover:bg-[#4A8AC8]/10 group-hover:text-[#1E4A8A] dark:hover:text-[#4A8AC8] transition-colors">
          {icon}
        </div>
        <span className="text-xs font-black text-[#1E4A8A] dark:text-[#4A8AC8]">
          {trend}
        </span>
      </div>
      <p className="text-[10px] font-black text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-widest mb-1">
        {label}
      </p>
      <p className="text-4xl font-black text-[#1A2A4A] dark:text-[#E8EEF8] tracking-tighter">
        {value}
      </p>
    </div>
  );
}

function LogItem({
  type,
  text,
  time,
}: {
  type: string;
  text: string;
  time: string;
}) {
  return (
    <div className="flex items-center gap-6 p-4 rounded-2xl hover:bg-[#F0F4F8] dark:hover:bg-[#0A122A] transition-colors border border-transparent hover:border-[#D0DCE8] dark:hover:border-[#1A2A4A]">
      <span className="w-10 text-[10px] font-black text-[#1E4A8A] dark:text-[#4A8AC8] uppercase tracking-widest">
        {type}
      </span>
      <p className="flex-1 text-sm font-bold text-[#1A2A4A] dark:text-[#E8EEF8] leading-tight">
        {text}
      </p>
      <span className="text-[10px] font-black text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-widest">
        {time}
      </span>
    </div>
  );
}
