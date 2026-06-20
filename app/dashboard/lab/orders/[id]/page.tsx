"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  FlaskConical,
  User,
  Stethoscope,
  Clock,
  AlertTriangle,
  Zap,
  CheckCircle2,
  XCircle,
  Loader2,
  Activity,
  TestTube,
  FileText,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";
import LabResultForm from "@/components/lab/LabResultForm";
import LabResultCard from "@/components/lab/LabResultCard";

// ── Types ──────────────────────────────────────────────────────────────────
type LabUrgency     = "ROUTINE" | "URGENT" | "STAT";
type LabOrderStatus = "ORDERED" | "SAMPLE_COLLECTED" | "PROCESSING" | "RESULTED" | "CANCELLED";

interface LabResult {
  id: string;
  resultValue: string;
  unit: string | null;
  referenceRange: string | null;
  isAbnormal: boolean;
  interpretation: string | null;
  enteredAt: string;
}

interface LabOrder {
  id: string;
  testName: string;
  urgency: LabUrgency;
  status: LabOrderStatus;
  sampleType: string | null;
  notes: string | null;
  orderedAt: string;
  patientId: string;
  testCatalogue: {
    name: string; code: string; category: string;
    referenceRange: string | null; unit: string | null; turnaroundHrs: number | null;
  } | null;
  patient: {
    cardNumber: string | null;
    user: { name: string; email: string; phone: string | null };
    allergies: { allergen: string; severity: string }[];
  };
  doctor: { user: { name: string; email: string } };
  result: LabResult | null;
  appointment: { id: string; dateTime: string } | null;
}

// ── Status stepper config ──────────────────────────────────────────────────
const STEPS: { status: LabOrderStatus; label: string; sublabel: string }[] = [
  { status: "ORDERED",          label: "Order Placed",      sublabel: "Awaiting sample" },
  { status: "SAMPLE_COLLECTED", label: "Sample Collected",  sublabel: "Ready for analysis" },
  { status: "PROCESSING",       label: "Processing",        sublabel: "Under analysis" },
  { status: "RESULTED",         label: "Results Ready",     sublabel: "Complete" },
];

const STEP_INDEX: Record<LabOrderStatus, number> = {
  ORDERED: 0, SAMPLE_COLLECTED: 1, PROCESSING: 2, RESULTED: 3, CANCELLED: -1,
};

const URGENCY_CONFIG: Record<LabUrgency, { label: string; badge: string; icon: React.ReactNode }> = {
  ROUTINE: { label: "Routine", badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",      icon: <Clock size={13} /> },
  URGENT:  { label: "Urgent",  badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300", icon: <AlertTriangle size={13} /> },
  STAT:    { label: "STAT",    badge: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 animate-pulse", icon: <Zap size={13} /> },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-ET", {
    dateStyle: "medium", timeStyle: "short",
  });
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function LabOrderDetailPage() {
  const { id }  = useParams<{ id: string }>();
  const router  = useRouter();

  const [order, setOrder]           = useState<LabOrder | null>(null);
  const [loading, setLoading]       = useState(true);
  const [updating, setUpdating]     = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // ── Fetch order ──────────────────────────────────────────────────────────
  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/lab/orders/${id}`);
      if (!res.ok) {
        toast.error("Order not found");
        router.replace("/dashboard/lab/orders");
        return;
      }
      const data: LabOrder = await res.json();
      setOrder(data);
    } catch {
      toast.error("Failed to load order");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  // ── Update status ────────────────────────────────────────────────────────
  const updateStatus = async (newStatus: LabOrderStatus) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/lab/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated: LabOrder = await res.json();
        setOrder(updated);
        toast.success(`Status updated to: ${newStatus.replace("_", " ")}`);
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to update status");
      }
    } catch {
      toast.error("Unexpected error");
    } finally {
      setUpdating(false);
    }
  };

  // ── Cancel order ──────────────────────────────────────────────────────────
  const cancelOrder = async () => {
    if (!confirm("Are you sure you want to cancel this lab order?")) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/lab/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      if (res.ok) {
        setOrder((prev) => prev ? { ...prev, status: "CANCELLED" } : prev);
        toast.success("Order cancelled");
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to cancel");
      }
    } catch {
      toast.error("Unexpected error");
    } finally {
      setCancelling(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 size={36} className="animate-spin text-teal-600 dark:text-teal-400" />
        <p className="text-sm font-medium text-[#5A6E8A] dark:text-[#8A9CBA]">Loading order details...</p>
      </div>
    );
  }

  if (!order) return null;

  const urgCfg      = URGENCY_CONFIG[order.urgency];
  const currentStep = STEP_INDEX[order.status];
  const isCancelled = order.status === "CANCELLED";
  const isResulted  = order.status === "RESULTED";
  const isProcessing = order.status === "PROCESSING";

  return (
    <div className="space-y-8 max-w-4xl">
      {/* ── Back + Header ── */}
      <div className="flex items-start gap-4">
        <Link
          href="/dashboard/lab/orders"
          className="p-3 bg-[#F0F4F8] dark:bg-[#081614] border border-[#CCECE9] dark:border-[#0F3330] rounded-2xl text-[#5A6E8A] dark:text-[#8A9CBA] hover:text-teal-600 dark:hover:text-teal-400 transition-colors shrink-0"
        >
          <ChevronLeft size={22} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-black text-[#1A2A4A] dark:text-[#E8EEF8] tracking-tight">
              {order.testName}
            </h1>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-black uppercase tracking-wider ${urgCfg.badge}`}>
              {urgCfg.icon}
              {urgCfg.label}
            </span>
            {isCancelled && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-[11px] font-black uppercase tracking-wider">
                <XCircle size={13} />
                Cancelled
              </span>
            )}
          </div>
          <p className="text-sm text-[#5A6E8A] dark:text-[#8A9CBA] mt-1">
            Ordered {formatDate(order.orderedAt)}
            {order.testCatalogue && (
              <span className="ml-2 font-mono font-bold text-teal-600 dark:text-teal-400">
                [{order.testCatalogue.code}]
              </span>
            )}
          </p>
        </div>
      </div>

      {/* ── STAT Banner ── */}
      {order.urgency === "STAT" && !isCancelled && !isResulted && (
        <div className="flex items-center gap-4 px-5 py-3.5 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-2xl">
          <Zap size={18} className="text-red-600 dark:text-red-400 animate-pulse shrink-0" />
          <p className="text-sm font-black text-red-700 dark:text-red-300">
            🚨 STAT Order — process immediately and enter results as soon as available.
          </p>
        </div>
      )}

      {/* ── Status Stepper ── */}
      {!isCancelled && (
        <div className="bg-white dark:bg-[#0D1F1E] rounded-2xl border border-[#CCECE9] dark:border-[#0F3330] p-6">
          <p className="text-[10px] font-black text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-widest mb-6">
            Order Progress
          </p>
          <div className="flex items-start gap-0">
            {STEPS.map((step, idx) => {
              const isDone    = currentStep > idx;
              const isCurrent = currentStep === idx;
              const isFuture  = currentStep < idx;
              const isLast    = idx === STEPS.length - 1;

              return (
                <React.Fragment key={step.status}>
                  <div className="flex flex-col items-center flex-1">
                    {/* Circle */}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                        isDone
                          ? "bg-teal-600 border-teal-600 text-white"
                          : isCurrent
                          ? "bg-white dark:bg-[#0D1F1E] border-teal-600 text-teal-600 dark:text-teal-400 shadow-[0_0_0_4px_rgba(13,148,136,0.15)]"
                          : "bg-[#F0F4F8] dark:bg-[#081614] border-[#CCECE9] dark:border-[#0F3330] text-[#5A6E8A] dark:text-[#8A9CBA]"
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 size={18} />
                      ) : isCurrent ? (
                        <Activity size={18} className="animate-pulse" />
                      ) : (
                        <span className="text-xs font-black">{idx + 1}</span>
                      )}
                    </div>
                    {/* Label */}
                    <div className="text-center mt-2 px-1">
                      <p className={`text-[11px] font-black ${isCurrent ? "text-teal-600 dark:text-teal-400" : isDone ? "text-[#1A2A4A] dark:text-[#E8EEF8]" : "text-[#5A6E8A] dark:text-[#8A9CBA]"}`}>
                        {step.label}
                      </p>
                      <p className="text-[10px] text-[#8A9CBA] dark:text-[#5A6E8A] mt-0.5">
                        {step.sublabel}
                      </p>
                    </div>
                  </div>
                  {/* Connector */}
                  {!isLast && (
                    <div className="flex-1 h-0.5 mt-5 mx-1 transition-all duration-500 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-700 ${
                          idx < currentStep ? "bg-teal-600 w-full" : "bg-[#CCECE9] dark:bg-[#0F3330] w-full"
                        }`}
                      />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Main Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Patient + Order Details */}
        <div className="lg:col-span-2 space-y-4">
          {/* Patient Card */}
          <div className="bg-white dark:bg-[#0D1F1E] rounded-2xl border border-[#CCECE9] dark:border-[#0F3330] p-6">
            <div className="flex items-center gap-2 mb-4">
              <User size={16} className="text-teal-600 dark:text-teal-400" />
              <p className="text-[10px] font-black text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-widest">
                Patient
              </p>
            </div>
            <p className="font-black text-[#1A2A4A] dark:text-[#E8EEF8]">
              {order.patient.user.name}
            </p>
            {order.patient.cardNumber && (
              <p className="text-xs font-mono font-bold text-teal-600 dark:text-teal-400 mt-1">
                Card #{order.patient.cardNumber}
              </p>
            )}
            <div className="mt-3 space-y-1">
              <p className="text-xs text-[#5A6E8A] dark:text-[#8A9CBA]">{order.patient.user.email}</p>
              {order.patient.user.phone && (
                <p className="text-xs text-[#5A6E8A] dark:text-[#8A9CBA]">{order.patient.user.phone}</p>
              )}
            </div>
            {order.patient.allergies.length > 0 && (
              <div className="mt-3 pt-3 border-t border-[#CCECE9] dark:border-[#0F3330]">
                <p className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <TriangleAlert size={11} /> Allergies
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {order.patient.allergies.map((a, i) => (
                    <span key={i} className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
                      {a.allergen}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Doctor Card */}
          <div className="bg-white dark:bg-[#0D1F1E] rounded-2xl border border-[#CCECE9] dark:border-[#0F3330] p-6">
            <div className="flex items-center gap-2 mb-4">
              <Stethoscope size={16} className="text-teal-600 dark:text-teal-400" />
              <p className="text-[10px] font-black text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-widest">
                Ordering Physician
              </p>
            </div>
            <p className="font-black text-[#1A2A4A] dark:text-[#E8EEF8]">
              Dr. {order.doctor.user.name}
            </p>
            <p className="text-xs text-[#5A6E8A] dark:text-[#8A9CBA] mt-1">{order.doctor.user.email}</p>
          </div>

          {/* Order Details */}
          <div className="bg-white dark:bg-[#0D1F1E] rounded-2xl border border-[#CCECE9] dark:border-[#0F3330] p-6">
            <div className="flex items-center gap-2 mb-4">
              <TestTube size={16} className="text-teal-600 dark:text-teal-400" />
              <p className="text-[10px] font-black text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-widest">
                Order Details
              </p>
            </div>
            <dl className="space-y-3">
              {[
                { label: "Test Name", value: order.testName },
                { label: "Sample Type", value: order.sampleType ?? "Not specified" },
                order.testCatalogue && { label: "Category", value: order.testCatalogue.category },
                order.testCatalogue?.turnaroundHrs && { label: "Turnaround", value: `${order.testCatalogue.turnaroundHrs} hours` },
              ].filter(Boolean).map((item: any) => (
                <div key={item.label}>
                  <dt className="text-[10px] font-black text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-wider">
                    {item.label}
                  </dt>
                  <dd className="text-sm font-semibold text-[#1A2A4A] dark:text-[#E8EEF8] mt-0.5">
                    {item.value}
                  </dd>
                </div>
              ))}
              {order.notes && (
                <div>
                  <dt className="text-[10px] font-black text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-wider flex items-center gap-1">
                    <FileText size={10} /> Clinical Notes
                  </dt>
                  <dd className="text-sm text-[#5A6E8A] dark:text-[#8A9CBA] mt-0.5 italic">{order.notes}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {/* Right: Actions + Result */}
        <div className="lg:col-span-3 space-y-4">
          {/* ── Action Card ── */}
          {!isCancelled && (
            <div className="bg-white dark:bg-[#0D1F1E] rounded-2xl border border-[#CCECE9] dark:border-[#0F3330] p-6">
              <p className="text-[10px] font-black text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-widest mb-5">
                Actions
              </p>

              <div className="space-y-3">
                {/* ORDERED → Mark Sample Collected */}
                {order.status === "ORDERED" && (
                  <button
                    onClick={() => updateStatus("SAMPLE_COLLECTED")}
                    disabled={updating}
                    className="w-full flex items-center justify-center gap-3 py-3.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white rounded-2xl font-bold text-sm transition-all duration-200 active:scale-[0.98] shadow-md shadow-amber-500/20"
                  >
                    {updating ? <Loader2 size={18} className="animate-spin" /> : <TestTube size={18} />}
                    Mark Sample Collected
                  </button>
                )}

                {/* SAMPLE_COLLECTED → Mark Processing */}
                {order.status === "SAMPLE_COLLECTED" && (
                  <button
                    onClick={() => updateStatus("PROCESSING")}
                    disabled={updating}
                    className="w-full flex items-center justify-center gap-3 py-3.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white rounded-2xl font-bold text-sm transition-all duration-200 active:scale-[0.98] shadow-md shadow-teal-600/20"
                  >
                    {updating ? <Loader2 size={18} className="animate-spin" /> : <Activity size={18} />}
                    Mark Processing
                  </button>
                )}

                {/* RESULTED → read-only notice */}
                {isResulted && (
                  <div className="flex items-center gap-3 py-3.5 px-5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl">
                    <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
                    <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                      Order completed — result recorded below.
                    </p>
                  </div>
                )}

                {/* Cancel Button */}
                {!isResulted && (
                  <button
                    onClick={cancelOrder}
                    disabled={cancelling || updating}
                    className="w-full flex items-center justify-center gap-2 py-3 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-2xl font-bold text-sm transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
                  >
                    {cancelling ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                    Cancel Order
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── Enter Result (PROCESSING state) ── */}
          {isProcessing && !order.result && (
            <LabResultForm
              labOrderId={id}
              testCatalogue={order.testCatalogue}
              onSuccess={fetchOrder}
            />
          )}

          {/* ── Result Card (RESULTED) ── */}
          {order.result && (
            <LabResultCard labOrder={order} />
          )}

          {/* Cancelled state card */}
          {isCancelled && (
            <div className="bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-200 dark:border-red-800 p-8 text-center">
              <XCircle size={36} className="text-red-400 mx-auto mb-3" />
              <p className="font-black text-red-600 dark:text-red-400">Order Cancelled</p>
              <p className="text-sm text-red-400 dark:text-red-500 mt-1">
                This order has been cancelled and no further action is required.
              </p>
              <Link
                href="/dashboard/lab/orders"
                className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 rounded-xl text-sm font-bold transition-colors"
              >
                <ChevronLeft size={16} />
                Back to Orders
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
