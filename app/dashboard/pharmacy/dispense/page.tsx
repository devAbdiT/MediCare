"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Pill, CheckCircle2, AlertTriangle, Clock, Loader2,
  ChevronDown, ChevronRight, FlaskConical, User, CalendarDays,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface PrescriptionItem {
  id: string;
  drugName: string;
  dose: string;
  frequency: string;
  duration: string;
  route: string;
  quantity: number | null;
  instructions: string | null;
  dispensedQty: number;
  remainingQty: number;
  fullyDispensed: boolean;
  matchedDrugId: string | null;
  matchedDrugName: string | null;
  availableStock: number;
}

interface PendingRecord {
  recordId: string;
  date: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  allDispensed: boolean;
  items: PrescriptionItem[];
}

interface DispensedToday {
  id: string;
  drugId: string;
  dispensedAt: string;
  quantity: number;
  patientName: string;
  dispenserName: string;
  notes: string | null;
  drug: { name: string; unit: string };
}

// ─── Dispense Modal ─────────────────────────────────────────────────────────────
function DispenseModal({
  record,
  open,
  onClose,
  onSuccess,
}: {
  record: PendingRecord;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successItems, setSuccessItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) {
      const init: Record<string, string> = {};
      record.items.forEach((item) => {
        if (!item.fullyDispensed && item.matchedDrugId) {
          init[item.id] = String(item.remainingQty || item.quantity || 1);
        }
      });
      setQuantities(init);
      setError("");
      setSuccessItems(new Set());
    }
  }, [open, record]);

  const handleDispense = async () => {
    setError("");
    const toDispense = record.items.filter(
      (item) => !item.fullyDispensed && item.matchedDrugId && quantities[item.id] && Number(quantities[item.id]) > 0
    );

    if (toDispense.length === 0) {
      setError("No items ready to dispense. Make sure drugs are matched and quantities are set.");
      return;
    }

    // Validate stock
    for (const item of toDispense) {
      const qty = Number(quantities[item.id]);
      if (qty > item.availableStock) {
        setError(`Insufficient stock for ${item.drugName}. Available: ${item.availableStock}, Requested: ${qty}`);
        return;
      }
    }

    setLoading(true);
    const newSuccess = new Set(successItems);

    try {
      for (const item of toDispense) {
        const res = await fetch("/api/pharmacy/dispense", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            drugId: item.matchedDrugId,
            prescriptionId: item.id,
            patientId: record.patientId,
            quantity: Number(quantities[item.id]),
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Dispense failed");
        newSuccess.add(item.id);
      }
      setSuccessItems(newSuccess);
      onSuccess();
      setTimeout(() => onClose(), 1200);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const pendingItems = record.items.filter((i) => !i.fullyDispensed);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-white dark:bg-[#111C3A] border-[#D0DCE8] dark:border-[#1A2A4A]">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-[#1A2A4A] dark:text-[#E8EEF8]">
            Dispense Prescription
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 text-sm bg-[#F8FAFC] dark:bg-[#0A122A] rounded-xl p-4 mt-1">
          <div>
            <span className="text-[#5A6E8A] dark:text-[#8A9CBA] text-xs font-bold uppercase">Patient</span>
            <p className="font-bold text-[#1A2A4A] dark:text-[#E8EEF8]">{record.patientName}</p>
          </div>
          <div>
            <span className="text-[#5A6E8A] dark:text-[#8A9CBA] text-xs font-bold uppercase">Prescribed By</span>
            <p className="font-bold text-[#1A2A4A] dark:text-[#E8EEF8]">Dr. {record.doctorName}</p>
          </div>
          <div>
            <span className="text-[#5A6E8A] dark:text-[#8A9CBA] text-xs font-bold uppercase">Date</span>
            <p className="font-bold text-[#1A2A4A] dark:text-[#E8EEF8]">{format(new Date(record.date), "MMM dd, yyyy")}</p>
          </div>
          <div>
            <span className="text-[#5A6E8A] dark:text-[#8A9CBA] text-xs font-bold uppercase">Items</span>
            <p className="font-bold text-[#1A2A4A] dark:text-[#E8EEF8]">{pendingItems.length} pending</p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm flex items-start gap-2">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        <div className="space-y-3 mt-1">
          {pendingItems.map((item) => {
            const isSuccess = successItems.has(item.id);
            const qty = Number(quantities[item.id] || 0);
            const hasInsufficient = item.matchedDrugId && qty > item.availableStock;

            return (
              <div
                key={item.id}
                className={cn(
                  "border rounded-2xl p-4 space-y-3 transition-colors",
                  isSuccess
                    ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800"
                    : hasInsufficient
                    ? "border-red-300 bg-red-50 dark:bg-red-900/10 dark:border-red-800"
                    : "border-[#D0DCE8] dark:border-[#1A2A4A] bg-white dark:bg-[#0A122A]"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-[#1A2A4A] dark:text-[#E8EEF8]">{item.drugName}</p>
                    <p className="text-xs text-[#5A6E8A] dark:text-[#8A9CBA] mt-0.5">
                      {item.dose} · {item.frequency} · {item.duration} · {item.route}
                    </p>
                    {item.instructions && (
                      <p className="text-xs text-[#5A6E8A] dark:text-[#8A9CBA] italic mt-0.5">{item.instructions}</p>
                    )}
                  </div>
                  {isSuccess && (
                    <CheckCircle2 size={20} className="text-emerald-500 shrink-0 mt-0.5" />
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="bg-[#F0F4F8] dark:bg-[#111C3A] rounded-xl p-2.5">
                    <p className="text-[#5A6E8A] dark:text-[#8A9CBA] font-bold uppercase tracking-wider mb-0.5">Prescribed</p>
                    <p className="font-black text-[#1A2A4A] dark:text-[#E8EEF8]">{item.quantity ?? "—"}</p>
                  </div>
                  <div className={cn("rounded-xl p-2.5",
                    !item.matchedDrugId
                      ? "bg-gray-100 dark:bg-gray-800"
                      : item.availableStock === 0
                      ? "bg-red-100 dark:bg-red-900/30"
                      : item.availableStock <= 20
                      ? "bg-amber-50 dark:bg-amber-900/20"
                      : "bg-emerald-50 dark:bg-emerald-900/20"
                  )}>
                    <p className="text-[#5A6E8A] dark:text-[#8A9CBA] font-bold uppercase tracking-wider mb-0.5">In Stock</p>
                    <p className={cn("font-black",
                      !item.matchedDrugId
                        ? "text-gray-400"
                        : item.availableStock === 0
                        ? "text-red-600 dark:text-red-400"
                        : item.availableStock <= 20
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-emerald-600 dark:text-emerald-400"
                    )}>
                      {item.matchedDrugId ? item.availableStock : "Unmatched"}
                    </p>
                  </div>
                  <div className="bg-[#F0F4F8] dark:bg-[#111C3A] rounded-xl p-2.5">
                    <p className="text-[#5A6E8A] dark:text-[#8A9CBA] font-bold uppercase tracking-wider mb-0.5">Dispense Qty</p>
                    {item.matchedDrugId ? (
                      <input
                        type="number"
                        min="0"
                        max={item.availableStock}
                        value={quantities[item.id] ?? ""}
                        onChange={(e) =>
                          setQuantities((prev) => ({ ...prev, [item.id]: e.target.value }))
                        }
                        disabled={isSuccess}
                        className="w-full bg-white dark:bg-[#0A122A] border border-[#D0DCE8] dark:border-[#1A2A4A] rounded-lg px-2 py-1 text-sm font-bold text-[#1A2A4A] dark:text-[#E8EEF8] outline-none focus:ring-2 focus:ring-[#7C3AED] disabled:opacity-50"
                      />
                    ) : (
                      <p className="text-xs text-amber-600 dark:text-amber-400 font-bold">No match</p>
                    )}
                  </div>
                </div>

                {!item.matchedDrugId && (
                  <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 font-medium">
                    <AlertTriangle size={13} />
                    Drug not found in catalogue. Add it first via Drug Catalogue.
                  </div>
                )}
                {hasInsufficient && (
                  <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 font-medium">
                    <AlertTriangle size={13} />
                    Requested quantity exceeds available stock ({item.availableStock} available).
                  </div>
                )}
                {item.matchedDrugId && item.matchedDrugName !== item.drugName && (
                  <div className="text-xs text-[#5A6E8A] dark:text-[#8A9CBA]">
                    Matched to catalogue: <span className="font-bold text-[#7C3AED] dark:text-[#A78BFA]">{item.matchedDrugName}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={handleDispense}
          disabled={loading || successItems.size === pendingItems.length}
          className="w-full py-3 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl font-bold transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
        >
          {loading ? (
            <><Loader2 size={16} className="animate-spin" /> Dispensing...</>
          ) : successItems.size === pendingItems.length ? (
            <><CheckCircle2 size={16} /> All Dispensed</>
          ) : (
            <><Pill size={16} /> Confirm Dispense</>
          )}
        </button>
      </DialogContent>
    </Dialog>
  );
}

// ─── Pending Row ────────────────────────────────────────────────────────────────
function PendingRow({ record, onDispense }: { record: PendingRecord; onDispense: () => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr
        className="border-b border-[#F0F4F8] dark:border-[#1A2A4A] hover:bg-[#F8FAFC] dark:hover:bg-[#0A122A]/50 transition-colors cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <td className="px-4 py-3 w-8">
          <button className="text-[#5A6E8A] dark:text-[#8A9CBA] p-1 rounded-lg hover:bg-[#E2E8F0] dark:hover:bg-[#1A2A4A]">
            {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          </button>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
              <User size={14} />
            </div>
            <span className="font-bold text-[#1A2A4A] dark:text-[#E8EEF8] text-sm">{record.patientName}</span>
          </div>
        </td>
        <td className="px-4 py-3 text-sm text-[#5A6E8A] dark:text-[#8A9CBA]">Dr. {record.doctorName}</td>
        <td className="px-4 py-3 text-sm text-[#5A6E8A] dark:text-[#8A9CBA]">
          {format(new Date(record.date), "MMM dd, yyyy")}
        </td>
        <td className="px-4 py-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            {record.items.filter((i) => !i.fullyDispensed).length} pending
          </span>
        </td>
        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onDispense}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-xl transition-colors"
          >
            <Pill size={13} /> Dispense
          </button>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-violet-50/30 dark:bg-violet-900/5 border-b border-[#F0F4F8] dark:border-[#1A2A4A]">
          <td colSpan={6} className="px-8 pb-4 pt-2">
            <div className="text-xs font-black uppercase text-[#7C3AED] dark:text-[#A78BFA] tracking-widest mb-3">
              Prescription Items
            </div>
            <div className="space-y-2">
              {record.items.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center justify-between py-2 px-3 rounded-xl text-sm",
                    item.fullyDispensed
                      ? "bg-emerald-50 dark:bg-emerald-900/10"
                      : "bg-white dark:bg-[#0A122A] border border-[#E2E8F0] dark:border-[#1A2A4A]"
                  )}
                >
                  <div className="flex items-center gap-2">
                    {item.fullyDispensed ? (
                      <CheckCircle2 size={14} className="text-emerald-500" />
                    ) : (
                      <Clock size={14} className="text-amber-500" />
                    )}
                    <span className="font-bold text-[#1A2A4A] dark:text-[#E8EEF8]">{item.drugName}</span>
                    <span className="text-[#5A6E8A] dark:text-[#8A9CBA] text-xs">
                      {item.dose} · {item.frequency}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-[#5A6E8A] dark:text-[#8A9CBA]">
                      Qty: <span className="font-bold text-[#1A2A4A] dark:text-[#E8EEF8]">{item.quantity ?? "?"}</span>
                    </span>
                    <span className={cn("font-bold", item.fullyDispensed ? "text-emerald-600" : "text-amber-600")}>
                      {item.fullyDispensed ? "Dispensed" : `${item.remainingQty} remaining`}
                    </span>
                    {!item.matchedDrugId && (
                      <span className="text-red-500 font-bold flex items-center gap-1">
                        <AlertTriangle size={11} /> Not in catalogue
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────
export default function DispensePage() {
  const [pending, setPending] = useState<PendingRecord[]>([]);
  const [dispensedToday, setDispensedToday] = useState<DispensedToday[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<PendingRecord | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/pharmacy/dispense");
      if (res.ok) {
        const data = await res.json();
        setPending(data.pending);
        setDispensedToday(data.dispensedToday);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-8 max-w-full">
      <div>
        <h1 className="text-3xl font-black text-[#1A2A4A] dark:text-[#E8EEF8] tracking-tight">Dispense</h1>
        <p className="text-[#5A6E8A] dark:text-[#8A9CBA] font-medium mt-1">
          Process pending prescriptions and track today's dispensing activity.
        </p>
      </div>

      {/* Section A: Pending Prescriptions */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Clock size={18} />
          </div>
          <h2 className="text-xl font-bold text-[#1A2A4A] dark:text-[#E8EEF8]">
            Pending Prescriptions
            {pending.length > 0 && (
              <span className="ml-2 text-sm px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full font-bold">
                {pending.length}
              </span>
            )}
          </h2>
        </div>

        <div className="bg-white dark:bg-[#111C3A] rounded-[2rem] border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-[10px] text-[#5A6E8A] dark:text-[#8A9CBA] uppercase bg-[#F8FAFC] dark:bg-[#0A122A] border-b border-[#D0DCE8] dark:border-[#1A2A4A]">
                <tr>
                  <th className="px-4 py-4 w-8" />
                  <th className="px-4 py-4 text-left font-black tracking-wider">Patient</th>
                  <th className="px-4 py-4 text-left font-black tracking-wider">Doctor</th>
                  <th className="px-4 py-4 text-left font-black tracking-wider">Date</th>
                  <th className="px-4 py-4 text-left font-black tracking-wider">Items</th>
                  <th className="px-4 py-4 text-left font-black tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="flex items-center justify-center gap-3 text-[#5A6E8A]">
                        <Loader2 size={20} className="animate-spin text-[#7C3AED]" />
                        Loading prescriptions...
                      </div>
                    </td>
                  </tr>
                ) : pending.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-2 text-[#5A6E8A] dark:text-[#8A9CBA]">
                        <CheckCircle2 size={32} className="text-emerald-400" />
                        <p className="font-bold">All prescriptions dispensed!</p>
                        <p className="text-sm">No pending prescriptions at this time.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  pending.map((record) => (
                    <PendingRow
                      key={record.recordId}
                      record={record}
                      onDispense={() => setSelectedRecord(record)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Section B: Dispensed Today */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <FlaskConical size={18} />
          </div>
          <h2 className="text-xl font-bold text-[#1A2A4A] dark:text-[#E8EEF8]">
            Dispensed Today
            {dispensedToday.length > 0 && (
              <span className="ml-2 text-sm px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full font-bold">
                {dispensedToday.length}
              </span>
            )}
          </h2>
        </div>

        <div className="bg-white dark:bg-[#111C3A] rounded-[2rem] border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-[10px] text-[#5A6E8A] dark:text-[#8A9CBA] uppercase bg-[#F8FAFC] dark:bg-[#0A122A] border-b border-[#D0DCE8] dark:border-[#1A2A4A]">
                <tr>
                  <th className="px-5 py-4 text-left font-black tracking-wider">Drug</th>
                  <th className="px-5 py-4 text-left font-black tracking-wider">Patient</th>
                  <th className="px-5 py-4 text-center font-black tracking-wider">Qty</th>
                  <th className="px-5 py-4 text-left font-black tracking-wider">Dispensed By</th>
                  <th className="px-5 py-4 text-left font-black tracking-wider">Time</th>
                </tr>
              </thead>
              <tbody>
                {dispensedToday.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-[#5A6E8A] dark:text-[#8A9CBA]">
                      No dispensings recorded today yet.
                    </td>
                  </tr>
                ) : (
                  dispensedToday.map((d) => (
                    <tr key={d.id} className="border-b border-[#F0F4F8] dark:border-[#1A2A4A] hover:bg-[#F8FAFC] dark:hover:bg-[#0A122A]/50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
                            <Pill size={14} />
                          </div>
                          <div>
                            <p className="font-bold text-[#1A2A4A] dark:text-[#E8EEF8]">{d.drug.name}</p>
                            <p className="text-xs text-[#5A6E8A] dark:text-[#8A9CBA]">{d.drug.unit}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-[#5A6E8A]" />
                          <span className="text-[#1A2A4A] dark:text-[#E8EEF8] font-medium">{d.patientName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className="font-black text-[#1A2A4A] dark:text-[#E8EEF8] text-base">{d.quantity}</span>
                      </td>
                      <td className="px-5 py-3 text-[#5A6E8A] dark:text-[#8A9CBA] text-sm">
                        {d.dispenserName}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5 text-[#5A6E8A] dark:text-[#8A9CBA] text-xs">
                          <CalendarDays size={12} />
                          {format(new Date(d.dispensedAt), "HH:mm")}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Dispense Modal */}
      {selectedRecord && (
        <DispenseModal
          record={selectedRecord}
          open={!!selectedRecord}
          onClose={() => setSelectedRecord(null)}
          onSuccess={() => {
            setSelectedRecord(null);
            fetchData();
          }}
        />
      )}
    </div>
  );
}
