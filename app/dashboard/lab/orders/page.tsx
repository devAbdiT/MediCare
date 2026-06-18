"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  FlaskConical,
  Search,
  X,
  Loader2,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock,
  Activity,
  Zap,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────
type LabUrgency     = "ROUTINE" | "URGENT" | "STAT";
type LabOrderStatus = "ORDERED" | "SAMPLE_COLLECTED" | "PROCESSING" | "RESULTED" | "CANCELLED";

interface LabOrder {
  id: string;
  testName: string;
  urgency: LabUrgency;
  status: LabOrderStatus;
  orderedAt: string;
  testCatalogue: { code: string } | null;
  patient: { cardNumber: string | null; user: { name: string } };
  doctor:  { user: { name: string } };
}

// ── Config ─────────────────────────────────────────────────────────────────
const URGENCY_BADGE: Record<LabUrgency, string> = {
  STAT:    "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 animate-pulse ring-1 ring-red-400/40",
  URGENT:  "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  ROUTINE: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
};
const URGENCY_ICON: Record<LabUrgency, React.ReactNode> = {
  STAT:    <Zap size={11} />,
  URGENT:  <AlertTriangle size={11} />,
  ROUTINE: <Clock size={11} />,
};

const STATUS_CONFIG: Record<LabOrderStatus, { label: string; cls: string; icon: React.ReactNode }> = {
  ORDERED:          { label: "Ordered",          cls: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",         icon: <Clock size={11} /> },
  SAMPLE_COLLECTED: { label: "Sample Collected", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",     icon: <Activity size={11} /> },
  PROCESSING:       { label: "Processing",       cls: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",         icon: <Activity size={11} /> },
  RESULTED:         { label: "Resulted",         cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300", icon: <CheckCircle2 size={11} /> },
  CANCELLED:        { label: "Cancelled",        cls: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",             icon: <XCircle size={11} /> },
};

type FilterTab = "ALL" | "PENDING" | "IN_PROGRESS" | "RESULTED" | "CANCELLED";

const TABS: { key: FilterTab; label: string; statuses?: LabOrderStatus[] }[] = [
  { key: "ALL",         label: "All" },
  { key: "PENDING",     label: "Pending",     statuses: ["ORDERED"] },
  { key: "IN_PROGRESS", label: "In Progress", statuses: ["SAMPLE_COLLECTED", "PROCESSING"] },
  { key: "RESULTED",    label: "Resulted",    statuses: ["RESULTED"] },
  { key: "CANCELLED",   label: "Cancelled",   statuses: ["CANCELLED"] },
];

function formatRelative(dateStr: string) {
  const diff  = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return "Just now";
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

// ── Component ──────────────────────────────────────────────────────────────
export default function LabOrdersPage() {
  const [orders, setOrders]         = useState<LabOrder[]>([]);
  const [loading, setLoading]       = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab]   = useState<FilterTab>("ALL");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/lab/orders");
      if (res.ok) {
        setOrders(await res.json());
        setLastUpdated(new Date());
      }
    } catch {/* ignore */} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    const iv = setInterval(fetchOrders, 60000);
    return () => clearInterval(iv);
  }, [fetchOrders]);

  // ── Filter logic ───────────────────────────────────────────────────────
  const tabStatuses = TABS.find((t) => t.key === activeTab)?.statuses;

  const filtered = orders.filter((o) => {
    const matchesTab =
      !tabStatuses || tabStatuses.includes(o.status);
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      o.patient.user.name.toLowerCase().includes(q) ||
      o.testName.toLowerCase().includes(q) ||
      (o.testCatalogue?.code ?? "").toLowerCase().includes(q);
    return matchesTab && matchesSearch;
  });

  // ── Tab counts ─────────────────────────────────────────────────────────
  const tabCount = (tab: { statuses?: LabOrderStatus[] }) =>
    tab.statuses
      ? orders.filter((o) => tab.statuses!.includes(o.status)).length
      : orders.length;

  const statOrders = orders.filter(
    (o) => o.urgency === "STAT" && o.status !== "RESULTED" && o.status !== "CANCELLED"
  ).length;

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-600/10 dark:bg-teal-500/10 flex items-center justify-center">
            <FlaskConical size={24} className="text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#1A2A4A] dark:text-[#E8EEF8] tracking-tight">
              All Lab Orders
            </h1>
            <p className="text-sm text-[#5A6E8A] dark:text-[#8A9CBA] mt-0.5">
              {orders.length} total · {lastUpdated ? `Updated ${formatRelative(lastUpdated.toISOString())}` : "Loading..."}
            </p>
          </div>
        </div>
        <button
          onClick={fetchOrders}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-600/10 hover:bg-teal-600 text-teal-700 hover:text-white dark:text-teal-400 dark:hover:text-white rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 disabled:opacity-60"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* ── STAT Alert ── */}
      {statOrders > 0 && (
        <div className="flex items-center gap-4 px-5 py-3.5 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-2xl">
          <Zap size={18} className="text-red-600 dark:text-red-400 animate-pulse shrink-0" />
          <p className="text-sm font-black text-red-700 dark:text-red-300">
            {statOrders} active STAT order{statOrders !== 1 ? "s" : ""} — requires immediate attention!
          </p>
        </div>
      )}

      {/* ── Search Bar ── */}
      <div className="relative">
        <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5A6E8A] dark:text-[#8A9CBA]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by patient name, test name, or code..."
          className="w-full pl-11 pr-10 py-3.5 bg-[#F0F4F8] dark:bg-[#081614] border border-[#CCECE9] dark:border-[#0F3330] rounded-2xl text-sm font-medium text-[#1A2A4A] dark:text-[#E8EEF8] placeholder:text-[#5A6E8A]/60 outline-none focus:ring-2 focus:ring-teal-500/30 transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5A6E8A] hover:text-[#1A2A4A] dark:hover:text-[#E8EEF8]"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* ── Filter Tabs ── */}
      <div className="flex items-center gap-2 flex-wrap">
        {TABS.map((tab) => {
          const count = tabCount(tab);
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
                isActive
                  ? "bg-teal-600 text-white shadow-md shadow-teal-600/20"
                  : "bg-[#F0F4F8] dark:bg-[#081614] text-[#5A6E8A] dark:text-[#8A9CBA] hover:bg-teal-50 dark:hover:bg-teal-900/20 hover:text-teal-700 dark:hover:text-teal-400 border border-[#CCECE9] dark:border-[#0F3330]"
              }`}
            >
              {tab.label}
              <span
                className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-[#D0DCE8] dark:bg-[#1A2A4A] text-[#5A6E8A] dark:text-[#8A9CBA]"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Table ── */}
      <div className="bg-[#F0F4F8] dark:bg-[#081614] rounded-2xl border border-[#CCECE9] dark:border-[#0F3330] overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 size={32} className="animate-spin text-teal-600 dark:text-teal-400" />
            <p className="text-sm font-medium text-[#5A6E8A] dark:text-[#8A9CBA]">Loading orders...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <FlaskConical size={36} className="text-[#CCECE9] dark:text-[#0F3330]" />
            <p className="text-sm font-bold text-[#5A6E8A] dark:text-[#8A9CBA]">
              {searchQuery ? "No orders match your search" : "No orders in this category"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#CCECE9] dark:border-[#0F3330]">
                  {["Patient", "Test", "Urgency", "Doctor", "Ordered", "Status", "Manage"].map((h) => (
                    <th
                      key={h}
                      className="text-left text-[10px] font-black uppercase tracking-widest text-[#5A6E8A] dark:text-[#8A9CBA] py-4 px-5 first:pl-6 last:pr-6"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => {
                  const urgBadge = URGENCY_BADGE[order.urgency];
                  const urgIcon  = URGENCY_ICON[order.urgency];
                  const stsCfg   = STATUS_CONFIG[order.status];
                  const isStatActive = order.urgency === "STAT" && order.status !== "RESULTED" && order.status !== "CANCELLED";

                  return (
                    <tr
                      key={order.id}
                      className={`border-b border-[#CCECE9]/50 dark:border-[#0F3330]/50 transition-colors ${
                        isStatActive
                          ? "bg-red-50/60 dark:bg-red-900/10 hover:bg-red-50 dark:hover:bg-red-900/20"
                          : "hover:bg-white/70 dark:hover:bg-[#0D1F1E]/40"
                      }`}
                    >
                      {/* Patient */}
                      <td className="pl-6 py-4">
                        <p className="text-sm font-bold text-[#1A2A4A] dark:text-[#E8EEF8]">
                          {order.patient.user.name}
                        </p>
                        {order.patient.cardNumber && (
                          <p className="text-[10px] font-mono text-[#5A6E8A] dark:text-[#8A9CBA] mt-0.5">
                            #{order.patient.cardNumber}
                          </p>
                        )}
                      </td>

                      {/* Test */}
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-[#1A2A4A] dark:text-[#E8EEF8] max-w-[180px] truncate">
                          {order.testName}
                        </p>
                        {order.testCatalogue && (
                          <span className="text-[10px] font-mono font-bold text-teal-600 dark:text-teal-400">
                            {order.testCatalogue.code}
                          </span>
                        )}
                      </td>

                      {/* Urgency */}
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${urgBadge}`}>
                          {urgIcon}
                          {order.urgency}
                        </span>
                      </td>

                      {/* Doctor */}
                      <td className="px-5 py-4">
                        <p className="text-sm text-[#5A6E8A] dark:text-[#8A9CBA]">
                          Dr. {order.doctor.user.name}
                        </p>
                      </td>

                      {/* Ordered At */}
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-[#5A6E8A] dark:text-[#8A9CBA]">
                          {formatRelative(order.orderedAt)}
                        </p>
                        <p className="text-[10px] text-[#8A9CBA] dark:text-[#5A6E8A] mt-0.5">
                          {new Date(order.orderedAt).toLocaleDateString("en-ET", {
                            month: "short", day: "numeric",
                          })}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${stsCfg.cls}`}>
                          {stsCfg.icon}
                          {stsCfg.label}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-5 py-4 pr-6">
                        <Link
                          href={`/dashboard/lab/orders/${order.id}`}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600/10 hover:bg-teal-600 text-teal-700 hover:text-white dark:text-teal-400 dark:hover:text-white rounded-xl text-xs font-bold transition-all duration-200 active:scale-95"
                        >
                          Manage
                          <ArrowRight size={12} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
