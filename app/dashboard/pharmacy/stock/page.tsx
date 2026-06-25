"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Package, Plus, AlertTriangle, Clock, ChevronDown, ChevronRight,
  Loader2, TrendingDown, Boxes, SlidersHorizontal, PackagePlus,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface DrugStock {
  id: string;
  batchNumber: string | null;
  quantity: number;
  expiryDate: string | null;
  receivedAt: string;
}

interface DrugWithStock {
  id: string;
  name: string;
  genericName: string | null;
  form: string;
  strength: string | null;
  unit: string;
  category: string;
  reorderLevel: number;
  isActive: boolean;
  totalStock: number;
  isLowStock: boolean;
  isOutOfStock: boolean;
  isExpiringSoon: boolean;
  stocks: DrugStock[];
}

function StatusBadge({ drug }: { drug: DrugWithStock }) {
  if (drug.isOutOfStock)
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
        <span className="w-1.5 h-1.5 rounded-full bg-red-600" /> Out of Stock
      </span>
    );
  if (drug.isLowStock)
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Low Stock
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> In Stock
    </span>
  );
}

function AddStockModal({ drug, onSuccess }: { drug: DrugWithStock; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!quantity || Number(quantity) <= 0) {
      setError("Quantity must be a positive number.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/pharmacy/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          drugId: drug.id,
          quantity: Number(quantity),
          batchNumber: batchNumber || undefined,
          expiryDate: expiryDate || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setOpen(false);
      setQuantity(""); setBatchNumber(""); setExpiryDate("");
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-violet-50 text-violet-700 hover:bg-violet-100 dark:bg-violet-900/20 dark:text-violet-400 dark:hover:bg-violet-900/40 rounded-xl transition-colors border border-violet-200 dark:border-violet-800">
          <PackagePlus size={13} /> Add Stock
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[420px] bg-white dark:bg-[#111C3A] border-[#D0DCE8] dark:border-[#1A2A4A]">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-[#1A2A4A] dark:text-[#E8EEF8]">
            Add Stock — {drug.name}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-xl">
              {error}
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-[#5A6E8A] dark:text-[#8A9CBA]">Quantity *</label>
            <input
              required type="number" min="1" value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#F0F4F8] dark:bg-[#0A122A] rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#7C3AED] dark:text-[#E8EEF8]"
              placeholder="e.g. 200"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-[#5A6E8A] dark:text-[#8A9CBA]">Batch Number</label>
            <input
              value={batchNumber} onChange={(e) => setBatchNumber(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#F0F4F8] dark:bg-[#0A122A] rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#7C3AED] dark:text-[#E8EEF8]"
              placeholder="e.g. BATCH-2025-001"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-[#5A6E8A] dark:text-[#8A9CBA]">Expiry Date</label>
            <input
              type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#F0F4F8] dark:bg-[#0A122A] rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#7C3AED] dark:text-[#E8EEF8]"
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full py-2.5 bg-[#7C3AED] text-white rounded-xl font-bold text-sm hover:bg-[#6D28D9] transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Confirm Stock Entry
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AdjustStockModal({ drug, onSuccess }: { drug: DrugWithStock; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [adjustment, setAdjustment] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!adjustment || Number(adjustment) === 0) {
      setError("Adjustment cannot be zero.");
      return;
    }
    if (!reason.trim()) {
      setError("A reason is required.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/pharmacy/stock/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drugId: drug.id, adjustment: Number(adjustment), reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setOpen(false);
      setAdjustment(""); setReason("");
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-800/30 dark:text-slate-400 dark:hover:bg-slate-800/60 rounded-xl transition-colors border border-slate-200 dark:border-slate-700">
          <SlidersHorizontal size={13} /> Adjust
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[420px] bg-white dark:bg-[#111C3A] border-[#D0DCE8] dark:border-[#1A2A4A]">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-[#1A2A4A] dark:text-[#E8EEF8]">
            Adjust Stock — {drug.name}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-1 px-1 py-2 bg-[#F8FAFC] dark:bg-[#0A122A] rounded-xl flex items-center justify-between text-sm">
          <span className="text-[#5A6E8A] dark:text-[#8A9CBA] font-medium">Current Stock</span>
          <span className="font-black text-[#1A2A4A] dark:text-[#E8EEF8] text-lg">{drug.totalStock} {drug.unit}</span>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-xl">
              {error}
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-[#5A6E8A] dark:text-[#8A9CBA]">
              Adjustment (use negative to reduce) *
            </label>
            <input
              required type="number" value={adjustment}
              onChange={(e) => setAdjustment(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#F0F4F8] dark:bg-[#0A122A] rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#7C3AED] dark:text-[#E8EEF8]"
              placeholder="e.g. -10 or +50"
            />
            {adjustment && (
              <p className={cn("text-xs font-bold mt-1", Number(adjustment) >= 0 ? "text-emerald-600" : "text-red-500")}>
                New total will be: {drug.totalStock + Number(adjustment)} {drug.unit}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-[#5A6E8A] dark:text-[#8A9CBA]">Reason *</label>
            <input
              required value={reason} onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#F0F4F8] dark:bg-[#0A122A] rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#7C3AED] dark:text-[#E8EEF8]"
              placeholder="e.g. Damaged stock, inventory correction..."
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full py-2.5 bg-[#7C3AED] text-white rounded-xl font-bold text-sm hover:bg-[#6D28D9] transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Confirm Adjustment
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DrugRow({ drug, onRefresh }: { drug: DrugWithStock; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr
        className={cn(
          "border-b border-[#F0F4F8] dark:border-[#1A2A4A] transition-colors cursor-pointer",
          expanded ? "bg-violet-50/50 dark:bg-violet-900/10" : "hover:bg-[#F8FAFC] dark:hover:bg-[#0A122A]/50"
        )}
        onClick={() => setExpanded(!expanded)}
      >
        <td className="px-4 py-3 w-8">
          <button className="text-[#5A6E8A] dark:text-[#8A9CBA] p-1 rounded-lg hover:bg-[#E2E8F0] dark:hover:bg-[#1A2A4A] transition-colors">
            {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          </button>
        </td>
        <td className="px-4 py-3">
          <div className="font-bold text-[#1A2A4A] dark:text-[#E8EEF8] text-sm">{drug.name}</div>
          <div className="text-xs text-[#5A6E8A] dark:text-[#8A9CBA]">{drug.genericName || ""}</div>
        </td>
        <td className="px-4 py-3 text-sm text-[#5A6E8A] dark:text-[#8A9CBA] capitalize">{drug.form.toLowerCase()}</td>
        <td className="px-4 py-3 text-sm text-[#5A6E8A] dark:text-[#8A9CBA]">
          {drug.strength ? drug.strength + " " + drug.unit : "-"}
        </td>
        <td className="px-4 py-3 text-sm text-center text-[#5A6E8A] dark:text-[#8A9CBA]">
          {drug.stocks.filter((s) => s.quantity > 0).length}
        </td>
        <td className="px-4 py-3 text-center">
          <div className="flex items-center justify-center gap-1.5">
            {drug.isLowStock && !drug.isOutOfStock && (
              <AlertTriangle size={14} className="text-amber-500" />
            )}
            <span
              className={cn(
                "font-black text-base",
                drug.isOutOfStock
                  ? "text-red-700 dark:text-red-400"
                  : drug.isLowStock
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-emerald-600 dark:text-emerald-400"
              )}
            >
              {drug.totalStock}
            </span>
          </div>
        </td>
        <td className="px-4 py-3 text-sm text-center text-[#5A6E8A] dark:text-[#8A9CBA]">
          {drug.reorderLevel}
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1.5">
            <StatusBadge drug={drug} />
            {drug.isExpiringSoon && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                <Clock size={10} /> Expiring
              </span>
            )}
          </div>
        </td>
        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-2">
            <AddStockModal drug={drug} onSuccess={onRefresh} />
            <AdjustStockModal drug={drug} onSuccess={onRefresh} />
          </div>
        </td>
      </tr>

      {expanded && (
        <tr className="bg-violet-50/30 dark:bg-violet-900/5 border-b border-[#F0F4F8] dark:border-[#1A2A4A]">
          <td colSpan={9} className="px-8 pb-4 pt-2">
            <div className="text-xs font-black uppercase text-[#7C3AED] dark:text-[#A78BFA] tracking-widest mb-3">
              Stock Batches
            </div>
            {drug.stocks.length === 0 ? (
              <p className="text-xs text-[#5A6E8A] dark:text-[#8A9CBA]">No batches recorded yet.</p>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[#5A6E8A] dark:text-[#8A9CBA] font-bold">
                    <th className="text-left pb-2 pr-6">Batch No.</th>
                    <th className="text-right pb-2 pr-6">Quantity</th>
                    <th className="text-left pb-2 pr-6">Expiry Date</th>
                    <th className="text-left pb-2">Received</th>
                  </tr>
                </thead>
                <tbody>
                  {drug.stocks.map((stock) => {
                    const isExpired = stock.expiryDate && new Date(stock.expiryDate) < new Date();
                    const isExpiringSoon =
                      stock.expiryDate &&
                      !isExpired &&
                      new Date(stock.expiryDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

                    return (
                      <tr key={stock.id} className="border-t border-[#E8EEF8] dark:border-[#1A2A4A]">
                        <td className="py-2 pr-6 font-mono text-[#5A6E8A] dark:text-[#8A9CBA]">
                          {stock.batchNumber || "—"}
                        </td>
                        <td
                          className={cn(
                            "py-2 pr-6 text-right font-black",
                            stock.quantity < 0
                              ? "text-red-500"
                              : "text-[#1A2A4A] dark:text-[#E8EEF8]"
                          )}
                        >
                          {stock.quantity >= 0 ? "+" : ""}{stock.quantity}
                        </td>
                        <td
                          className={cn(
                            "py-2 pr-6 font-medium",
                            isExpired
                              ? "text-red-600 dark:text-red-400 font-bold"
                              : isExpiringSoon
                              ? "text-orange-600 dark:text-orange-400 font-bold"
                              : "text-[#5A6E8A] dark:text-[#8A9CBA]"
                          )}
                        >
                          {stock.expiryDate
                            ? format(new Date(stock.expiryDate), "MMM dd, yyyy")
                            : "—"}
                          {isExpired && " (Expired)"}
                          {isExpiringSoon && " (Soon)"}
                        </td>
                        <td className="py-2 text-[#5A6E8A] dark:text-[#8A9CBA]">
                          {format(new Date(stock.receivedAt), "MMM dd, yyyy")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

export default function StockManagementPage() {
  const [drugs, setDrugs] = useState<DrugWithStock[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStock = useCallback(async () => {
    try {
      const res = await fetch("/api/pharmacy/stock");
      if (res.ok) {
        setDrugs(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStock();
  }, [fetchStock]);

  const totalDrugTypes = drugs.length;
  const lowStockCount = drugs.filter((d) => d.isLowStock && !d.isOutOfStock).length;
  const outOfStockCount = drugs.filter((d) => d.isOutOfStock).length;
  const expiringSoonCount = drugs.filter((d) => d.isExpiringSoon).length;
  const totalUnits = drugs.reduce((sum, d) => sum + d.totalStock, 0);

  return (
    <div className="space-y-6 max-w-full mx-auto">
      <div>
        <h1 className="text-3xl font-black text-[#1A2A4A] dark:text-[#E8EEF8] tracking-tight">Stock Management</h1>
        <p className="text-[#5A6E8A] dark:text-[#8A9CBA] font-medium mt-1">
          Manage drug inventory, add batches, and track stock levels.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#111C3A] p-5 rounded-3xl border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Package size={22} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-[#5A6E8A] dark:text-[#8A9CBA] tracking-widest">Drug Types</p>
            <p className="text-2xl font-black text-[#1A2A4A] dark:text-[#E8EEF8]">{totalDrugTypes}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111C3A] p-5 rounded-3xl border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Boxes size={22} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-[#5A6E8A] dark:text-[#8A9CBA] tracking-widest">Total Units</p>
            <p className="text-2xl font-black text-[#1A2A4A] dark:text-[#E8EEF8]">{totalUnits.toLocaleString()}</p>
          </div>
        </div>

        <div className={cn("bg-white dark:bg-[#111C3A] p-5 rounded-3xl border shadow-sm flex items-center gap-4 relative overflow-hidden",
          lowStockCount + outOfStockCount > 0
            ? "border-red-200 dark:border-red-900/50"
            : "border-[#D0DCE8] dark:border-[#1A2A4A]"
        )}>
          {(lowStockCount + outOfStockCount > 0) && (
            <div className="absolute inset-0 bg-red-500/5 dark:bg-red-500/10" />
          )}
          <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center z-10",
            lowStockCount + outOfStockCount > 0
              ? "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400"
              : "bg-gray-100 dark:bg-[#0A122A] text-gray-400"
          )}>
            <TrendingDown size={22} />
          </div>
          <div className="z-10">
            <p className="text-[10px] font-bold uppercase text-[#5A6E8A] dark:text-[#8A9CBA] tracking-widest">Low / Out</p>
            <p className={cn("text-2xl font-black",
              lowStockCount + outOfStockCount > 0
                ? "text-red-600 dark:text-red-400"
                : "text-[#1A2A4A] dark:text-[#E8EEF8]"
            )}>
              {lowStockCount + outOfStockCount}
            </p>
          </div>
        </div>

        <div className={cn("bg-white dark:bg-[#111C3A] p-5 rounded-3xl border shadow-sm flex items-center gap-4 relative overflow-hidden",
          expiringSoonCount > 0
            ? "border-orange-200 dark:border-orange-900/50"
            : "border-[#D0DCE8] dark:border-[#1A2A4A]"
        )}>
          {expiringSoonCount > 0 && (
            <div className="absolute inset-0 bg-orange-500/5 dark:bg-orange-500/10" />
          )}
          <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center z-10",
            expiringSoonCount > 0
              ? "bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400"
              : "bg-gray-100 dark:bg-[#0A122A] text-gray-400"
          )}>
            <Clock size={22} />
          </div>
          <div className="z-10">
            <p className="text-[10px] font-bold uppercase text-[#5A6E8A] dark:text-[#8A9CBA] tracking-widest">Expiring &lt;30d</p>
            <p className={cn("text-2xl font-black",
              expiringSoonCount > 0
                ? "text-orange-600 dark:text-orange-400"
                : "text-[#1A2A4A] dark:text-[#E8EEF8]"
            )}>
              {expiringSoonCount}
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#111C3A] rounded-[2rem] border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] text-[#5A6E8A] dark:text-[#8A9CBA] uppercase bg-[#F8FAFC] dark:bg-[#0A122A] border-b border-[#D0DCE8] dark:border-[#1A2A4A]">
              <tr>
                <th className="px-4 py-4 w-8" />
                <th className="px-4 py-4 font-black tracking-wider">Drug</th>
                <th className="px-4 py-4 font-black tracking-wider">Form</th>
                <th className="px-4 py-4 font-black tracking-wider">Strength</th>
                <th className="px-4 py-4 font-black tracking-wider text-center">Batches</th>
                <th className="px-4 py-4 font-black tracking-wider text-center">Total Stock</th>
                <th className="px-4 py-4 font-black tracking-wider text-center">Min Level</th>
                <th className="px-4 py-4 font-black tracking-wider">Status</th>
                <th className="px-4 py-4 font-black tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-16 text-center">
                    <div className="flex items-center justify-center gap-3 text-[#5A6E8A]">
                      <Loader2 size={20} className="animate-spin text-[#7C3AED]" />
                      Loading stock data...
                    </div>
                  </td>
                </tr>
              ) : drugs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-16 text-center text-[#5A6E8A] dark:text-[#8A9CBA]">
                    No drugs in the catalogue. Add drugs first via the Drug Catalogue.
                  </td>
                </tr>
              ) : (
                drugs.map((drug) => (
                  <DrugRow key={drug.id} drug={drug} onRefresh={fetchStock} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
