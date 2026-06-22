"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { format, subDays } from "date-fns";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
  LineChart, Line,
} from "recharts";
import {
  Download, DollarSign, FileText, CheckCircle, AlertCircle,
  Calendar, TrendingUp, Users, Building2,
} from "lucide-react";

// ─── Shared Types ─────────────────────────────────────────────
interface RevenueData {
  summary: {
    totalInvoiced: number;
    totalCollected: number;
    totalOutstanding: number;
    invoiceCount: number;
    paidCount: number;
    pendingCount: number;
  };
  dailyRevenue: { date: string; invoiced: number; collected: number }[];
  byPaymentMethod: { method: string; amount: number }[];
  byCategory: { category: string; amount: number }[];
}

interface AppointmentData {
  total: number;
  byStatus: Record<string, number>;
  completionRate: number;
  noShowRate: number;
  dailyBreakdown: { date: string; completed: number; cancelled: number; noShow: number; scheduled: number }[];
}

interface DepartmentRow {
  id: string;
  name: string;
  appointmentCount: number;
  completedCount: number;
  cancelledCount: number;
  noShowCount: number;
  revenue: number;
  topDoctor: { name: string; appointmentCount: number };
}

// ─── Shared Colour Palette ────────────────────────────────────
const COLORS = ["#1E4A8A", "#0F766E", "#D97706", "#B91C1C", "#6D28D9", "#0369A1"];

const STATUS_COLORS: Record<string, string> = {
  COMPLETED:   "#10B981",
  SCHEDULED:   "#1E4A8A",
  CANCELLED:   "#EF4444",
  NO_SHOW:     "#F59E0B",
  CHECKED_IN:  "#6366F1",
  RESCHEDULED: "#8B5CF6",
};

// ─── Shared Sub-components ────────────────────────────────────
function DateFilter({
  from, to, onFromChange, onToChange, onApply,
}: {
  from: string; to: string;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
  onApply: () => void;
}) {
  return (
    <div className="flex items-end gap-3 bg-white dark:bg-[#111C3A] p-2 rounded-2xl border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-sm">
      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase text-[#5A6E8A] dark:text-[#8A9CBA] px-2">From</label>
        <input type="date" value={from} onChange={(e) => onFromChange(e.target.value)}
          className="px-3 py-2 bg-[#F0F4F8] dark:bg-[#0A122A] text-sm font-bold text-[#1A2A4A] dark:text-[#E8EEF8] rounded-xl border-none focus:ring-0" />
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase text-[#5A6E8A] dark:text-[#8A9CBA] px-2">To</label>
        <input type="date" value={to} onChange={(e) => onToChange(e.target.value)}
          className="px-3 py-2 bg-[#F0F4F8] dark:bg-[#0A122A] text-sm font-bold text-[#1A2A4A] dark:text-[#E8EEF8] rounded-xl border-none focus:ring-0" />
      </div>
      <button onClick={onApply}
        className="px-4 py-2 bg-[#1E4A8A] hover:bg-[#16386b] text-white font-bold rounded-xl h-9 transition-colors">
        Apply
      </button>
    </div>
  );
}

function ExportBtn({ type, from, to }: { type: string; from: string; to: string }) {
  return (
    <button
      onClick={() => window.open(`/api/reports/export?type=${type}&from=${from}&to=${to}`, "_blank")}
      className="flex items-center gap-2 px-4 py-2 bg-[#F0F4F8] dark:bg-[#111C3A] text-[#1A2A4A] dark:text-[#E8EEF8] hover:bg-[#E2E8F0] dark:hover:bg-[#1A2A4A] font-bold text-sm rounded-xl border border-[#D0DCE8] dark:border-[#2A3A5A] transition-colors"
    >
      <Download size={15} /> Export CSV
    </button>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-4 gap-6">
        {[1,2,3,4].map(i => <div key={i} className="h-28 bg-[#F0F4F8] dark:bg-[#111C3A] rounded-[2rem]" />)}
      </div>
      <div className="h-80 bg-[#F0F4F8] dark:bg-[#111C3A] rounded-[2.5rem]" />
    </div>
  );
}

function Card({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: string; sub?: string; color: string;
}) {
  return (
    <div className="bg-white dark:bg-[#111C3A] p-6 rounded-[2rem] border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-xl ${color}`}>{icon}</div>
        <span className="text-xs font-black uppercase tracking-widest text-[#5A6E8A] dark:text-[#8A9CBA]">{label}</span>
      </div>
      <h3 className="text-3xl font-black text-[#1A2A4A] dark:text-[#E8EEF8]">{value}</h3>
      {sub && <p className="text-sm text-[#5A6E8A] dark:text-[#8A9CBA] mt-1">{sub}</p>}
    </div>
  );
}

const tooltipStyle = {
  borderRadius: "1rem",
  border: "none",
  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
  fontSize: "12px",
};

// ═══════════════════════════════════════════════════════════════
// TAB: REVENUE
// ═══════════════════════════════════════════════════════════════
function RevenueTab({ from, to }: { from: string; to: string }) {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/reports/revenue?from=${from}&to=${to}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [from, to]);

  if (loading || !data) return <LoadingState />;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex justify-end">
        <ExportBtn type="revenue" from={from} to={to} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card icon={<FileText size={18} />} label="Total Invoiced"
          value={`ETB ${data.summary.totalInvoiced.toLocaleString()}`}
          color="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" />
        <Card icon={<DollarSign size={18} />} label="Total Collected"
          value={`ETB ${data.summary.totalCollected.toLocaleString()}`}
          color="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400" />
        <Card icon={<AlertCircle size={18} />} label="Outstanding"
          value={`ETB ${data.summary.totalOutstanding.toLocaleString()}`}
          color="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400" />
        <Card icon={<CheckCircle size={18} />} label="Paid Invoices"
          value={String(data.summary.paidCount)}
          sub={`of ${data.summary.invoiceCount} total`}
          color="bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-[#111C3A] p-8 rounded-[2.5rem] border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-sm">
          <h3 className="font-bold text-[#1A2A4A] dark:text-[#E8EEF8] mb-6">Daily Revenue Trends</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.dailyRevenue} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#D0DCE8" opacity={0.5} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#5A6E8A" }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#5A6E8A" }} />
                <RechartsTooltip cursor={{ fill: "rgba(0,0,0,0.02)" }} contentStyle={tooltipStyle} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: "20px", fontSize: "12px" }} />
                <Bar dataKey="invoiced" name="Invoiced" fill="#1E4A8A" radius={[4,4,0,0]} maxBarSize={40} />
                <Bar dataKey="collected" name="Collected" fill="#10B981" radius={[4,4,0,0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111C3A] p-8 rounded-[2.5rem] border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-sm flex flex-col">
          <h3 className="font-bold text-[#1A2A4A] dark:text-[#E8EEF8] mb-4">By Payment Method</h3>
          <div className="flex-1 min-h-[250px]">
            {data.byPaymentMethod.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.byPaymentMethod} cx="50%" cy="50%" innerRadius={55} outerRadius={75}
                    paddingAngle={5} dataKey="amount" nameKey="method">
                    {data.byPaymentMethod.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(v: any) => [`ETB ${Number(v).toLocaleString()}`, "Amount"]} contentStyle={tooltipStyle} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-[#5A6E8A] text-sm">No payment data.</div>
            )}
          </div>
        </div>
      </div>

      {/* Category Table */}
      <div className="bg-white dark:bg-[#111C3A] rounded-[2.5rem] border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-sm overflow-hidden">
        <div className="p-8 border-b border-[#D0DCE8] dark:border-[#1A2A4A]">
          <h3 className="font-bold text-[#1A2A4A] dark:text-[#E8EEF8]">Revenue by Service Category</h3>
        </div>
        <table className="w-full text-sm text-left">
          <thead className="text-[10px] text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-widest border-b border-[#D0DCE8] dark:border-[#1A2A4A]">
            <tr>
              <th className="px-8 py-4">Category</th>
              <th className="px-8 py-4 text-right">Total (ETB)</th>
              <th className="px-8 py-4 text-right">% of Total</th>
            </tr>
          </thead>
          <tbody>
            {[...data.byCategory].sort((a,b) => b.amount - a.amount).map((cat, i) => (
              <tr key={i} className="border-b border-[#D0DCE8] dark:border-[#1A2A4A] hover:bg-[#F0F4F8]/50 dark:hover:bg-[#0A122A]/50 transition-colors">
                <td className="px-8 py-4 font-bold text-[#1A2A4A] dark:text-[#E8EEF8]">{cat.category.replace(/_/g," ")}</td>
                <td className="px-8 py-4 text-right text-[#1A2A4A] dark:text-[#E8EEF8]">ETB {cat.amount.toLocaleString()}</td>
                <td className="px-8 py-4 text-right text-[#5A6E8A] dark:text-[#8A9CBA]">
                  {data.summary.totalInvoiced > 0 ? ((cat.amount / data.summary.totalInvoiced) * 100).toFixed(1) : 0}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TAB: APPOINTMENTS
// ═══════════════════════════════════════════════════════════════
function AppointmentsTab({ from, to }: { from: string; to: string }) {
  const [data, setData] = useState<AppointmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [deptFilter, setDeptFilter] = useState("");
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ from, to });
    if (deptFilter) params.set("departmentId", deptFilter);
    fetch(`/api/reports/appointments?${params}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [from, to, deptFilter]);

  useEffect(() => {
    fetch("/api/departments").then((r) => r.json()).then(setDepartments).catch(() => {});
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading || !data) return <LoadingState />;

  const pieData = Object.entries(data.byStatus)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Department filter */}
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="px-4 py-2 bg-white dark:bg-[#111C3A] text-sm font-bold text-[#1A2A4A] dark:text-[#E8EEF8] rounded-xl border border-[#D0DCE8] dark:border-[#1A2A4A] focus:outline-none focus:ring-2 focus:ring-[#1E4A8A]"
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <ExportBtn type="appointments" from={from} to={to} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card icon={<Calendar size={18} />} label="Total Appointments"
          value={data.total.toLocaleString()}
          color="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" />
        <Card icon={<CheckCircle size={18} />} label="Completion Rate"
          value={`${data.completionRate}%`}
          sub={`${data.byStatus.COMPLETED} completed`}
          color="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400" />
        <Card icon={<AlertCircle size={18} />} label="No-Show Rate"
          value={`${data.noShowRate}%`}
          sub={`${data.byStatus.NO_SHOW} no-shows`}
          color="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400" />
        <Card icon={<TrendingUp size={18} />} label="Cancellations"
          value={String(data.byStatus.CANCELLED)}
          sub="total cancelled"
          color="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie chart */}
        <div className="bg-white dark:bg-[#111C3A] p-8 rounded-[2.5rem] border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-sm flex flex-col">
          <h3 className="font-bold text-[#1A2A4A] dark:text-[#E8EEF8] mb-4">Status Breakdown</h3>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={75}
                  paddingAngle={4} dataKey="value" nameKey="name">
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.name] || COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={tooltipStyle} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Line chart */}
        <div className="lg:col-span-2 bg-white dark:bg-[#111C3A] p-8 rounded-[2.5rem] border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-sm">
          <h3 className="font-bold text-[#1A2A4A] dark:text-[#E8EEF8] mb-6">Daily Appointment Trends</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.dailyBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#D0DCE8" opacity={0.5} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#5A6E8A" }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#5A6E8A" }} allowDecimals={false} />
                <RechartsTooltip contentStyle={tooltipStyle} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: "20px", fontSize: "12px" }} />
                <Line type="monotone" dataKey="completed" name="Completed" stroke="#10B981" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="cancelled" name="Cancelled" stroke="#EF4444" strokeWidth={2} dot={false} strokeDasharray="4 4" />
                <Line type="monotone" dataKey="noShow" name="No-Show" stroke="#F59E0B" strokeWidth={2} dot={false} strokeDasharray="2 4" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Status Table */}
      <div className="bg-white dark:bg-[#111C3A] rounded-[2.5rem] border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-sm overflow-hidden">
        <div className="p-8 border-b border-[#D0DCE8] dark:border-[#1A2A4A]">
          <h3 className="font-bold text-[#1A2A4A] dark:text-[#E8EEF8]">Status Summary</h3>
        </div>
        <table className="w-full text-sm text-left">
          <thead className="text-[10px] text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-widest border-b border-[#D0DCE8] dark:border-[#1A2A4A]">
            <tr>
              <th className="px-8 py-4">Status</th>
              <th className="px-8 py-4 text-right">Count</th>
              <th className="px-8 py-4 text-right">% of Total</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(data.byStatus).map(([status, count]) => (
              <tr key={status} className="border-b border-[#D0DCE8] dark:border-[#1A2A4A] hover:bg-[#F0F4F8]/50 dark:hover:bg-[#0A122A]/50 transition-colors">
                <td className="px-8 py-4">
                  <span className="inline-flex items-center gap-2 font-bold text-[#1A2A4A] dark:text-[#E8EEF8]">
                    <span className="w-2.5 h-2.5 rounded-full inline-block"
                      style={{ backgroundColor: STATUS_COLORS[status] || "#888" }} />
                    {status.replace(/_/g," ")}
                  </span>
                </td>
                <td className="px-8 py-4 text-right font-bold text-[#1A2A4A] dark:text-[#E8EEF8]">{count}</td>
                <td className="px-8 py-4 text-right text-[#5A6E8A] dark:text-[#8A9CBA]">
                  {data.total > 0 ? ((count / data.total) * 100).toFixed(1) : 0}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TAB: DEPARTMENTS
// ═══════════════════════════════════════════════════════════════
function DepartmentsTab({ from, to }: { from: string; to: string }) {
  const [data, setData] = useState<DepartmentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/reports/departments?from=${from}&to=${to}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [from, to]);

  if (loading) return <LoadingState />;

  const totalAppts = data.reduce((s, d) => s + d.appointmentCount, 0);
  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top KPI strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card icon={<Building2 size={18} />} label="Active Departments"
          value={String(data.filter(d => d.appointmentCount > 0).length)}
          sub={`of ${data.length} total`}
          color="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" />
        <Card icon={<Users size={18} />} label="Total Appointments"
          value={totalAppts.toLocaleString()}
          color="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400" />
        <Card icon={<DollarSign size={18} />} label="Total Revenue"
          value={`ETB ${totalRevenue.toLocaleString()}`}
          color="bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400" />
      </div>

      <div className="flex justify-end">
        <ExportBtn type="departments" from={from} to={to} />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#111C3A] rounded-[2.5rem] border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-sm overflow-hidden">
        <div className="p-8 border-b border-[#D0DCE8] dark:border-[#1A2A4A]">
          <h3 className="font-bold text-[#1A2A4A] dark:text-[#E8EEF8]">Department Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-widest border-b border-[#D0DCE8] dark:border-[#1A2A4A]">
              <tr>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4 text-center">Appointments</th>
                <th className="px-6 py-4 text-center">Completed</th>
                <th className="px-6 py-4 text-center">Cancelled</th>
                <th className="px-6 py-4 text-center">No-Show</th>
                <th className="px-6 py-4 text-center min-w-[160px]">Completion Rate</th>
                <th className="px-6 py-4 text-right">Revenue (ETB)</th>
                <th className="px-6 py-4">Top Doctor</th>
              </tr>
            </thead>
            <tbody>
              {data.map((dept) => {
                const rate = dept.appointmentCount > 0
                  ? (dept.completedCount / dept.appointmentCount) * 100
                  : 0;
                return (
                  <tr key={dept.id} className="border-b border-[#D0DCE8] dark:border-[#1A2A4A] hover:bg-[#F0F4F8]/50 dark:hover:bg-[#0A122A]/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-[#1A2A4A] dark:text-[#E8EEF8] whitespace-nowrap">{dept.name}</td>
                    <td className="px-6 py-4 text-center text-[#1A2A4A] dark:text-[#E8EEF8]">{dept.appointmentCount}</td>
                    <td className="px-6 py-4 text-center text-emerald-600 dark:text-emerald-400 font-semibold">{dept.completedCount}</td>
                    <td className="px-6 py-4 text-center text-red-500 dark:text-red-400 font-semibold">{dept.cancelledCount}</td>
                    <td className="px-6 py-4 text-center text-amber-600 dark:text-amber-400 font-semibold">{dept.noShowCount}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-[#F0F4F8] dark:bg-[#0A122A] rounded-full h-2 overflow-hidden">
                          <div
                            className="h-2 rounded-full transition-all duration-500"
                            style={{
                              width: `${rate}%`,
                              backgroundColor: rate >= 70 ? "#10B981" : rate >= 40 ? "#F59E0B" : "#EF4444",
                            }}
                          />
                        </div>
                        <span className="text-xs font-bold text-[#5A6E8A] dark:text-[#8A9CBA] w-10 text-right">
                          {rate.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-[#1A2A4A] dark:text-[#E8EEF8]">
                      {dept.revenue > 0 ? dept.revenue.toLocaleString() : "—"}
                    </td>
                    <td className="px-6 py-4 text-[#5A6E8A] dark:text-[#8A9CBA] whitespace-nowrap text-xs">
                      {dept.topDoctor.name !== "—" ? (
                        <span>
                          {dept.topDoctor.name}
                          <span className="ml-1 text-[#8A9CBA]">({dept.topDoctor.appointmentCount})</span>
                        </span>
                      ) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════
export default function AdminReportsPage() {
  const [activeTab, setActiveTab] = useState("Revenue");
  const [from, setFrom] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"));
  const [to, setTo]   = useState(format(new Date(), "yyyy-MM-dd"));
  const [pendingFrom, setPendingFrom] = useState(from);
  const [pendingTo, setPendingTo]     = useState(to);

  const handleApply = () => {
    setFrom(pendingFrom);
    setTo(pendingTo);
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-black text-[#1A2A4A] dark:text-[#E8EEF8] tracking-tight">
              Reports &amp; Analytics
            </h1>
            <p className="text-[#5A6E8A] dark:text-[#8A9CBA] font-medium">
              Comprehensive financial and operational insights.
            </p>
          </div>

          <DateFilter
            from={pendingFrom} to={pendingTo}
            onFromChange={setPendingFrom}
            onToChange={setPendingTo}
            onApply={handleApply}
          />
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-[#D0DCE8] dark:border-[#1A2A4A]">
          {["Revenue", "Appointments", "Departments"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-8 py-4 text-sm font-bold transition-colors ${
                activeTab === tab
                  ? "text-[#1E4A8A] dark:text-[#4A8AC8] border-b-2 border-[#1E4A8A] dark:border-[#4A8AC8] bg-[#F0F4F8]/50 dark:bg-[#0A122A]/50"
                  : "text-[#5A6E8A] dark:text-[#8A9CBA] hover:bg-[#F0F4F8] dark:hover:bg-[#0A122A]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content — each tab manages its own fetch lifecycle */}
        {activeTab === "Revenue"      && <RevenueTab      from={from} to={to} />}
        {activeTab === "Appointments" && <AppointmentsTab from={from} to={to} />}
        {activeTab === "Departments"  && <DepartmentsTab  from={from} to={to} />}
      </div>
    </DashboardLayout>
  );
}
