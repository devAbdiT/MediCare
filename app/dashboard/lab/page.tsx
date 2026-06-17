// app/dashboard/lab/page.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  FlaskConical,
  Clock,
  CheckCircle2,
  Zap,
  Loader2,
  RefreshCw,
  ArrowRight,
  AlertTriangle,
  Activity,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";

// ── Types ──────────────────────────────────────────────────────────────────
type LabUrgency     = "ROUTINE" | "URGENT" | "STAT";
type LabOrderStatus = "ORDERED" | "SAMPLE_COLLECTED" | "PROCESSING" | "RESULTED" | "CANCELLED";

interface LabOrder {
  id: string;
  testName: string;
  urgency: LabUrgency;
  status: LabOrderStatus;
  orderedAt: string;
  patient: {
    user: { name: string };
    cardNumber?: string | null;
  };
  doctor: {
    user: { name: string };
  };
}

interface Stats {
  pending: number;
  inProgress: number;
  completedToday: number;
  statOrders: number;
}

// ── Urgency config ─────────────────────────────────────────────────────────
const URGENCY_CONFIG: Record<
  LabUrgency,
  { label: string; className: string; dot?: string }
> = {
  STAT: {
    label: "STAT",
    className:
      "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 font-black animate-pulse ring-1 ring-red-400/50",
    dot: "bg-red-500",
  },
  URGENT: {
    label: "URGENT",
    className:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 font-black",
    dot: "bg-orange-500",
  },
  ROUTINE: {
    label: "ROUTINE",
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 font-semibold",
    dot: "bg-blue-500",
  },
};

const URGENCY_SORT: Record<LabUrgency, number> = {
  STAT: 0,
  URGENT: 1,
  ROUTINE: 2,
};

const STATUS_LABEL: Record<LabOrderStatus, { label: string; cls: string }> = {
  ORDERED: {
    label: "Ordered",
    cls: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  },
  SAMPLE_COLLECTED: {
    label: "Sample Collected",
    cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  },
  PROCESSING: {
    label: "Processing",
    cls: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
  },
  RESULTED: {
    label: "Resulted",
    cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  },
  CANCELLED: {
    label: "Cancelled",
    cls: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  },
};

// ── Helpers ────────────────────────────────────────────────────────────────
function formatRelative(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return "Just now";
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

// ── Component ──────────────────────────────────────────────────────────────
export default function LabDashboardPage() {
  const { data: session } = authClient.useSession();
  const [orders, setOrders]   = useState<LabOrder[]>([]);
  const [stats, setStats]     = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/lab/orders?queue=true");
      if (!res.ok) throw new Error("Failed to fetch lab orders");
      const data: LabOrder[] = await res.json();

      // Sort: STAT → URGENT → ROUTINE, then oldest first within same urgency
      const sorted = [...data].sort((a, b) => {
        const urgencyDiff =
          URGENCY_SORT[a.urgency] - URGENCY_SORT[b.urgency];
        if (urgencyDiff !== 0) return urgencyDiff;
        return new Date(a.orderedAt).getTime() - new Date(b.orderedAt).getTime();
      });
      setOrders(sorted);

      // Compute stats
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      // Fetch all orders for stats (not just queue)
      const allRes = await fetch("/api/lab/orders");
      const allOrders: LabOrder[] = allRes.ok ? await allRes.json() : [];

      setStats({
        pending: allOrders.filter((o) => o.status === "ORDERED").length,
        inProgress: allOrders.filter(
          (o) => o.status === "SAMPLE_COLLECTED" || o.status === "PROCESSING"
        ).length,
        completedToday: allOrders.filter(
          (o) =>
            o.status === "RESULTED" &&
            new Date(o.orderedAt) >= todayStart
        ).length,
        statOrders: sorted.filter((o) => o.urgency === "STAT").length,
      });

      setLastUpdated(new Date());
    } catch {
      // Silently fail — the UI handles empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const firstName = session?.user?.name?.split(" ")[0] ?? "Technician";
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // ── Stat cards config ──────────────────────────────────────────────────
  const statCards = [
    {
      label: "Pending Orders",
      value: stats?.pending ?? "—",
      icon: Clock,
      bg: "bg-slate-50 dark:bg-slate-900/40",
      border: "border-slate-200 dark:border-slate-800",
      iconBg: "bg-slate-100 dark:bg-slate-800",
      iconColor: "text-slate-500 dark:text-slate-400",
      valueColor: "text-[#1A2A4A] dark:text-[#E8EEF8]",
    },
    {
      label: "In Progress",
      value: stats?.inProgress ?? "—",
      icon: Activity,
      bg: "bg-teal-50 dark:bg-teal-900/20",
      border: "border-teal-200 dark:border-teal-800",
      iconBg: "bg-teal-100 dark:bg-teal-900/40",
      iconColor: "text-teal-600 dark:text-teal-400",
      valueColor: "text-teal-700 dark:text-teal-300",
    },
    {
      label: "Completed Today",
      value: stats?.completedToday ?? "—",
      icon: CheckCircle2,
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
      border: "border-emerald-200 dark:border-emerald-800",
      iconBg: "bg-emerald-100 dark:bg-emerald-900/40",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      valueColor: "text-emerald-700 dark:text-emerald-300",
    },
    {
      label: "STAT Orders",
      value: stats?.statOrders ?? "—",
      icon: Zap,
      bg:
        (stats?.statOrders ?? 0) > 0
          ? "bg-red-50 dark:bg-red-900/20"
          : "bg-slate-50 dark:bg-slate-900/40",
      border:
        (stats?.statOrders ?? 0) > 0
          ? "border-red-300 dark:border-red-800"
          : "border-slate-200 dark:border-slate-800",
      iconBg:
        (stats?.statOrders ?? 0) > 0
          ? "bg-red-100 dark:bg-red-900/40"
          : "bg-slate-100 dark:bg-slate-800",
      iconColor:
        (stats?.statOrders ?? 0) > 0
          ? "text-red-600 dark:text-red-400"
          : "text-slate-400",
      valueColor:
        (stats?.statOrders ?? 0) > 0
          ? "text-red-700 dark:text-red-300"
          : "text-[#1A2A4A] dark:text-[#E8EEF8]",
      pulse: (stats?.statOrders ?? 0) > 0,
    },
  ];

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-teal-600 dark:text-teal-400 tracking-wide uppercase">
            {greeting},
          </p>
          <h1 className="text-3xl font-black text-[#1A2A4A] dark:text-[#E8EEF8] tracking-tight mt-1">
            {firstName} 👋
          </h1>
          <p className="text-sm text-[#5A6E8A] dark:text-[#8A9CBA] mt-1">
            Lab Technician Dashboard •{" "}
            {new Date().toLocaleDateString("en-ET", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-[11px] font-medium text-[#5A6E8A] dark:text-[#8A9CBA]">
              Updated {formatRelative(lastUpdated.toISOString())}
            </span>
          )}
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-600/10 hover:bg-teal-600 text-teal-700 hover:text-white dark:text-teal-400 dark:hover:text-white rounded-xl text-xs font-bold transition-all duration-300 active:scale-95 disabled:opacity-60"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── STAT Alert Banner ── */}
      {(stats?.statOrders ?? 0) > 0 && (
        <div className="flex items-center gap-4 px-6 py-4 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center shrink-0 animate-pulse">
            <AlertTriangle size={20} className="text-red-600 dark:text-red-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-black text-red-700 dark:text-red-300">
              🚨 {stats!.statOrders} STAT{" "}
              {stats!.statOrders === 1 ? "order requires" : "orders require"}{" "}
              immediate attention!
            </p>
            <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">
              STAT orders are highlighted at the top of the queue below.
            </p>
          </div>
        </div>
      )}

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={`${card.bg} ${card.border} border rounded-2xl p-5 transition-all duration-300`}
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center ${card.pulse ? "animate-pulse" : ""}`}
              >
                <card.icon size={20} className={card.iconColor} />
              </div>
              {card.pulse && (
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              )}
            </div>
            <p className="text-[10px] font-black text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-widest">
              {card.label}
            </p>
            <p className={`text-4xl font-black mt-1 ${card.valueColor}`}>
              {loading ? (
                <Loader2
                  size={28}
                  className="animate-spin text-[#D0DCE8] dark:text-[#1A2A4A] mt-1"
                />
              ) : (
                card.value
              )}
            </p>
          </div>
        ))}
      </div>

      {/* ── Pending Orders Queue ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-teal-600/10 dark:bg-teal-500/10 flex items-center justify-center">
              <FlaskConical size={16} className="text-teal-600 dark:text-teal-400" />
            </div>
            <h2 className="text-lg font-black text-[#1A2A4A] dark:text-[#E8EEF8] tracking-tight">
              Pending Orders Queue
            </h2>
            {orders.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-teal-600/10 text-teal-700 dark:text-teal-400 text-xs font-black">
                {orders.length}
              </span>
            )}
          </div>
          <Link
            href="/dashboard/lab/orders"
            className="flex items-center gap-1.5 text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline"
          >
            View All <ArrowRight size={14} />
          </Link>
        </div>

        <div className="bg-[#F0F4F8] dark:bg-[#081614] rounded-2xl border border-[#CCECE9] dark:border-[#0F3330] overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2
                size={32}
                className="animate-spin text-teal-600 dark:text-teal-400"
              />
              <p className="text-sm font-medium text-[#5A6E8A] dark:text-[#8A9CBA]">
                Loading orders queue...
              </p>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-16 h-16 rounded-2xl bg-teal-100 dark:bg-teal-900/20 flex items-center justify-center">
                <CheckCircle2
                  size={32}
                  className="text-teal-500 dark:text-teal-400"
                />
              </div>
              <p className="text-sm font-bold text-[#5A6E8A] dark:text-[#8A9CBA]">
                Queue is clear — no pending orders!
              </p>
              <p className="text-xs text-[#8A9CBA] dark:text-[#5A6E8A]">
                All lab orders have been processed.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#CCECE9] dark:border-[#0F3330]">
                    {[
                      "Patient",
                      "Test Name",
                      "Urgency",
                      "Ordered By",
                      "Ordered At",
                      "Status",
                      "Action",
                    ].map((h) => (
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
                  {orders.map((order, idx) => {
                    const urgency = URGENCY_CONFIG[order.urgency];
                    const status  = STATUS_LABEL[order.status];
                    const isStatRow = order.urgency === "STAT";

                    return (
                      <tr
                        key={order.id}
                        className={`border-b border-[#CCECE9]/50 dark:border-[#0F3330]/50 transition-colors ${
                          isStatRow
                            ? "bg-red-50/60 dark:bg-red-900/10 hover:bg-red-50 dark:hover:bg-red-900/20"
                            : "hover:bg-white/70 dark:hover:bg-[#0D1F1E]/40"
                        }`}
                      >
                        {/* Patient */}
                        <td className="pl-6 py-4">
                          <div>
                            <p className="text-sm font-bold text-[#1A2A4A] dark:text-[#E8EEF8]">
                              {order.patient.user.name}
                            </p>
                            {order.patient.cardNumber && (
                              <p className="text-[10px] font-mono text-[#5A6E8A] dark:text-[#8A9CBA] mt-0.5">
                                #{order.patient.cardNumber}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Test Name */}
                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-[#1A2A4A] dark:text-[#E8EEF8] max-w-[160px] truncate">
                            {order.testName}
                          </p>
                        </td>

                        {/* Urgency Badge */}
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-wider ${urgency.className}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${urgency.dot}`}
                            />
                            {urgency.label}
                          </span>
                        </td>

                        {/* Ordered By (Doctor) */}
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
                            {new Date(order.orderedAt).toLocaleTimeString(
                              "en-ET",
                              { hour: "2-digit", minute: "2-digit" }
                            )}
                          </p>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${status.cls}`}
                          >
                            {status.label}
                          </span>
                        </td>

                        {/* Action */}
                        <td className="px-5 py-4 pr-6">
                          <Link
                            href={`/dashboard/lab/orders/${order.id}`}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600/10 hover:bg-teal-600 text-teal-700 hover:text-white dark:text-teal-400 dark:hover:text-white rounded-xl text-xs font-bold transition-all duration-200 active:scale-95"
                          >
                            View Order
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
    </div>
  );
}
