"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  FlaskConical,
  Plus,
  Loader2,
  Search,
  X,
  ChevronDown,
  Clock,
  Zap,
  AlertTriangle,
  CheckCircle2,
  TestTube,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────────────
type LabUrgency     = "ROUTINE" | "URGENT" | "STAT";
type LabOrderStatus = "ORDERED" | "SAMPLE_COLLECTED" | "PROCESSING" | "RESULTED" | "CANCELLED";

interface CatalogueTest {
  id: string;
  name: string;
  code: string;
  category: string;
  turnaroundHrs: number | null;
  price: number | string | null;
}

interface LabOrder {
  id: string;
  testName: string;
  urgency: LabUrgency;
  status: LabOrderStatus;
  sampleType: string | null;
  notes: string | null;
  orderedAt: string;
  testCatalogue: { name: string; code: string } | null;
}

interface LabOrderFormProps {
  appointmentId: string;
  patientId: string;
}

// ── Config ─────────────────────────────────────────────────────────────────
const URGENCY_CONFIG: Record<LabUrgency, { label: string; icon: React.ReactNode; badge: string; bg: string }> = {
  ROUTINE: {
    label: "Routine",
    icon: <Clock size={13} />,
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    bg: "bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800",
  },
  URGENT: {
    label: "Urgent",
    icon: <AlertTriangle size={13} />,
    badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
    bg: "bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800",
  },
  STAT: {
    label: "STAT",
    icon: <Zap size={13} />,
    badge: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 animate-pulse ring-1 ring-red-400/40",
    bg: "bg-red-50 dark:bg-red-900/10 border-red-300 dark:border-red-800",
  },
};

const STATUS_CONFIG: Record<LabOrderStatus, { label: string; cls: string }> = {
  ORDERED:          { label: "Ordered",          cls: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" },
  SAMPLE_COLLECTED: { label: "Sample Collected", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  PROCESSING:       { label: "Processing",       cls: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300" },
  RESULTED:         { label: "Resulted ✓",       cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
  CANCELLED:        { label: "Cancelled",        cls: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" },
};

const SAMPLE_TYPES = [
  "Venous Blood",
  "Capillary Blood",
  "Arterial Blood",
  "Random Urine",
  "First Morning Urine",
  "24-Hour Urine",
  "Stool",
  "Sputum",
  "Throat Swab",
  "Wound Swab",
  "CSF",
  "Other",
];

// ── Component ──────────────────────────────────────────────────────────────
export default function LabOrderForm({ appointmentId, patientId }: LabOrderFormProps) {
  const [orders, setOrders]         = useState<LabOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [showForm, setShowForm]     = useState(false);

  // Form fields
  const [testName, setTestName]             = useState("");
  const [testCatalogueId, setTestCatalogueId] = useState<string | null>(null);
  const [urgency, setUrgency]               = useState<LabUrgency>("ROUTINE");
  const [sampleType, setSampleType]         = useState("");
  const [notes, setNotes]                   = useState("");
  const [isSubmitting, setIsSubmitting]     = useState(false);

  // Catalogue search
  const [searchQuery, setSearchQuery]       = useState("");
  const [searchResults, setSearchResults]   = useState<CatalogueTest[]>([]);
  const [searchLoading, setSearchLoading]   = useState(false);
  const [showDropdown, setShowDropdown]     = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchDebounceRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // ── Fetch existing orders for this appointment ──────────────────────────
  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch(`/api/lab/orders?appointmentId=${appointmentId}`);
      if (res.ok) setOrders(await res.json());
    } catch {
      // silently ignore
    } finally {
      setLoadingOrders(false);
    }
  }, [appointmentId]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // ── Catalogue type-ahead search ─────────────────────────────────────────
  useEffect(() => {
    clearTimeout(searchDebounceRef.current);
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    searchDebounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(
          `/api/lab/catalogue?q=${encodeURIComponent(searchQuery.trim())}&active=true`
        );
        if (res.ok) {
          const data: CatalogueTest[] = await res.json();
          setSearchResults(data);
          setShowDropdown(true);
        }
      } catch {/* ignore */} finally {
        setSearchLoading(false);
      }
    }, 280);
    return () => clearTimeout(searchDebounceRef.current);
  }, [searchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Select a test from catalogue ─────────────────────────────────────────
  const selectTest = (test: CatalogueTest) => {
    setTestName(test.name);
    setTestCatalogueId(test.id);
    setSearchQuery(test.name);
    setShowDropdown(false);
    setSearchResults([]);
  };

  // Clear test selection
  const clearTest = () => {
    setTestName("");
    setTestCatalogueId(null);
    setSearchQuery("");
    setShowDropdown(false);
  };

  // Reset form
  const resetForm = () => {
    setTestName("");
    setTestCatalogueId(null);
    setSearchQuery("");
    setUrgency("ROUTINE");
    setSampleType("");
    setNotes("");
    setShowDropdown(false);
    setSearchResults([]);
    setShowForm(false);
  };

  // ── Submit ─────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testName.trim()) {
      toast.error("Please enter or select a test name");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/lab/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId,
          patientId,
          testCatalogueId,
          testName: testName.trim(),
          urgency,
          sampleType: sampleType || null,
          notes: notes || null,
        }),
      });

      if (res.ok) {
        toast.success(
          urgency === "STAT"
            ? "🚨 STAT order placed — notifying lab immediately!"
            : "Lab order placed successfully"
        );
        resetForm();
        fetchOrders();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to place lab order");
      }
    } catch {
      toast.error("Unexpected error placing order");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="bg-white dark:bg-[#111C3A] rounded-[2rem] border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-sm overflow-hidden">
      {/* Card Header */}
      <div className="px-8 py-6 border-b border-[#F0F4F8] dark:border-[#1A2A4A] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center">
            <FlaskConical size={20} className="text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h3 className="font-black text-[#1A2A4A] dark:text-[#E8EEF8] tracking-tight">
              Order Lab Tests
            </h3>
            <p className="text-xs text-[#5A6E8A] dark:text-[#8A9CBA] mt-0.5">
              {orders.length > 0
                ? `${orders.length} order${orders.length !== 1 ? "s" : ""} placed`
                : "No orders yet"}
            </p>
          </div>
        </div>

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 active:scale-95 shadow-md shadow-teal-600/20"
          >
            <Plus size={15} />
            Add Lab Order
          </button>
        )}
      </div>

      {/* Existing Orders List */}
      {loadingOrders ? (
        <div className="flex items-center justify-center gap-2 py-8">
          <Loader2 size={18} className="animate-spin text-teal-600 dark:text-teal-400" />
          <span className="text-sm text-[#5A6E8A] dark:text-[#8A9CBA]">Loading orders...</span>
        </div>
      ) : orders.length > 0 ? (
        <div className="px-8 py-4 space-y-3">
          {orders.map((order) => {
            const urgCfg = URGENCY_CONFIG[order.urgency];
            const stsCfg = STATUS_CONFIG[order.status];
            return (
              <div
                key={order.id}
                className={`flex items-start justify-between gap-4 p-4 rounded-2xl border ${urgCfg.bg} transition-colors`}
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-white/60 dark:bg-black/20 flex items-center justify-center mt-0.5 shrink-0">
                    <TestTube size={15} className="text-teal-600 dark:text-teal-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-[#1A2A4A] dark:text-[#E8EEF8] truncate">
                        {order.testName}
                      </p>
                      {order.testCatalogue && (
                        <span className="text-[10px] font-mono font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 px-1.5 py-0.5 rounded">
                          {order.testCatalogue.code}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${urgCfg.badge}`}>
                        {urgCfg.icon}
                        {urgCfg.label}
                      </span>
                      <span className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${stsCfg.cls}`}>
                        {stsCfg.label}
                      </span>
                      {order.sampleType && (
                        <span className="text-[10px] text-[#5A6E8A] dark:text-[#8A9CBA] font-medium">
                          • {order.sampleType}
                        </span>
                      )}
                    </div>
                    {order.notes && (
                      <p className="text-[11px] text-[#5A6E8A] dark:text-[#8A9CBA] mt-1 italic">
                        {order.notes}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-[10px] text-[#5A6E8A] dark:text-[#8A9CBA] shrink-0 mt-1">
                  {new Date(order.orderedAt).toLocaleTimeString("en-ET", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : !showForm ? (
        <div className="flex flex-col items-center py-10 gap-2">
          <div className="w-12 h-12 rounded-2xl bg-[#F0F4F8] dark:bg-[#0A122A] flex items-center justify-center">
            <FlaskConical size={22} className="text-[#D0DCE8] dark:text-[#1A2A4A]" />
          </div>
          <p className="text-sm font-medium text-[#5A6E8A] dark:text-[#8A9CBA]">No lab orders for this visit</p>
        </div>
      ) : null}

      {/* ── Inline Add Form ── */}
      {showForm && (
        <form onSubmit={handleSubmit} className="px-8 py-6 border-t border-[#F0F4F8] dark:border-[#1A2A4A] space-y-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-black text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-widest">
              New Lab Order
            </p>
            <button
              type="button"
              onClick={resetForm}
              className="text-[#5A6E8A] hover:text-[#1A2A4A] dark:hover:text-[#E8EEF8] transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Test Search */}
          <div ref={dropdownRef} className="relative">
            <label className="block text-xs font-black text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-wider mb-1.5">
              Test Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5A6E8A] dark:text-[#8A9CBA] pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  // Allow free-text if no catalogue match is selected
                  if (testCatalogueId) {
                    setTestCatalogueId(null);
                  }
                  setTestName(e.target.value);
                }}
                placeholder="Search catalogue or type custom name..."
                className="w-full pl-10 pr-10 py-3 rounded-xl bg-[#F0F4F8] dark:bg-[#0A122A] border border-[#D0DCE8] dark:border-[#1A2A4A] text-sm font-medium text-[#1A2A4A] dark:text-[#E8EEF8] placeholder:text-[#5A6E8A]/60 outline-none focus:ring-2 focus:ring-teal-500/30 transition-all"
              />
              {searchLoading && (
                <Loader2
                  size={15}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-teal-600"
                />
              )}
              {testCatalogueId && !searchLoading && (
                <button
                  type="button"
                  onClick={clearTest}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5A6E8A] hover:text-red-500 transition-colors"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Catalogue Dropdown */}
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute z-50 w-full mt-1.5 bg-white dark:bg-[#111C3A] border border-[#D0DCE8] dark:border-[#1A2A4A] rounded-2xl shadow-xl overflow-hidden">
                {searchResults.map((test) => (
                  <button
                    key={test.id}
                    type="button"
                    onClick={() => selectTest(test)}
                    className="w-full flex items-start gap-3 px-4 py-3 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors text-left group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center shrink-0 mt-0.5">
                      <TestTube size={13} className="text-teal-600 dark:text-teal-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#1A2A4A] dark:text-[#E8EEF8] group-hover:text-teal-700 dark:group-hover:text-teal-300 truncate">
                          {test.name}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-teal-600 dark:text-teal-400 shrink-0">
                          {test.code}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-[#5A6E8A] dark:text-[#8A9CBA]">
                          {test.category}
                        </span>
                        {test.turnaroundHrs && (
                          <span className="text-[10px] text-[#5A6E8A] dark:text-[#8A9CBA]">
                            • {test.turnaroundHrs}h turnaround
                          </span>
                        )}
                        {test.price != null && (
                          <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400">
                            ETB {Number(test.price).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                    {testCatalogueId === test.id && (
                      <CheckCircle2 size={16} className="text-teal-500 shrink-0 mt-1" />
                    )}
                  </button>
                ))}
                <div className="px-4 py-2.5 border-t border-[#F0F4F8] dark:border-[#1A2A4A] bg-[#F8FAFB] dark:bg-[#0A122A]">
                  <p className="text-[10px] text-[#5A6E8A] dark:text-[#8A9CBA]">
                    Not listed? Keep typing to use a custom test name.
                  </p>
                </div>
              </div>
            )}

            {testCatalogueId && (
              <p className="text-[11px] text-teal-600 dark:text-teal-400 mt-1.5 flex items-center gap-1">
                <CheckCircle2 size={11} />
                Linked to catalogue test
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Urgency */}
            <div>
              <label className="block text-xs font-black text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-wider mb-1.5">
                Urgency
              </label>
              <div className="relative">
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value as LabUrgency)}
                  className="w-full appearance-none px-4 py-3 pr-10 rounded-xl bg-[#F0F4F8] dark:bg-[#0A122A] border border-[#D0DCE8] dark:border-[#1A2A4A] text-sm font-bold text-[#1A2A4A] dark:text-[#E8EEF8] outline-none focus:ring-2 focus:ring-teal-500/30 transition-all cursor-pointer"
                >
                  <option value="ROUTINE">⚪ Routine</option>
                  <option value="URGENT">🟠 Urgent</option>
                  <option value="STAT">🔴 STAT — Immediate</option>
                </select>
                <ChevronDown
                  size={15}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5A6E8A] pointer-events-none"
                />
              </div>
              {urgency === "STAT" && (
                <p className="text-[11px] text-red-500 dark:text-red-400 mt-1.5 flex items-center gap-1 font-bold">
                  <Zap size={11} />
                  STAT orders go to top of lab queue immediately
                </p>
              )}
            </div>

            {/* Sample Type */}
            <div>
              <label className="block text-xs font-black text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-wider mb-1.5">
                Sample Type
              </label>
              <div className="relative">
                <select
                  value={sampleType}
                  onChange={(e) => setSampleType(e.target.value)}
                  className="w-full appearance-none px-4 py-3 pr-10 rounded-xl bg-[#F0F4F8] dark:bg-[#0A122A] border border-[#D0DCE8] dark:border-[#1A2A4A] text-sm font-medium text-[#1A2A4A] dark:text-[#E8EEF8] outline-none focus:ring-2 focus:ring-teal-500/30 transition-all cursor-pointer"
                >
                  <option value="">— Select sample type —</option>
                  {SAMPLE_TYPES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <ChevronDown
                  size={15}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5A6E8A] pointer-events-none"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-black text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-wider mb-1.5">
              Clinical Notes <span className="font-normal normal-case text-[#8A9CBA]">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="e.g. Fasting required. Check for hemolysis..."
              className="w-full px-4 py-3 rounded-xl bg-[#F0F4F8] dark:bg-[#0A122A] border border-[#D0DCE8] dark:border-[#1A2A4A] text-sm font-medium text-[#1A2A4A] dark:text-[#E8EEF8] placeholder:text-[#5A6E8A]/60 outline-none focus:ring-2 focus:ring-teal-500/30 transition-all resize-none"
            />
          </div>

          {/* STAT warning */}
          {urgency === "STAT" && (
            <div className="flex items-start gap-3 p-3.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <Zap size={16} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs font-bold text-red-700 dark:text-red-300">
                This STAT order will appear at the very top of the lab technician's queue and is marked with a red pulsing badge.
              </p>
            </div>
          )}

          {/* Submit Row */}
          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={resetForm}
              className="px-5 py-2.5 rounded-xl border border-[#D0DCE8] dark:border-[#1A2A4A] text-sm font-bold text-[#5A6E8A] dark:text-[#8A9CBA] hover:bg-[#F0F4F8] dark:hover:bg-[#0A122A] transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !testName.trim()}
              className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white rounded-xl text-sm font-bold transition-all duration-200 active:scale-95 shadow-md shadow-teal-600/20"
            >
              {isSubmitting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <FlaskConical size={14} />
              )}
              {urgency === "STAT" ? "Place STAT Order" : "Place Order"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
