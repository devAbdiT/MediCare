"use client";

import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, Clock, ShieldAlert, PackageX, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

type Drug = {
  id: string;
  name: string;
  unit: string;
};

type OutOfStockAlert = { drug: Drug };
type LowStockAlert = { drug: Drug; totalStock: number; reorderLevel: number; deficit: number };
type ExpiringSoonAlert = { drug: Drug; batch: string | null; expiryDate: string; daysLeft: number; qty: number };
type ExpiredAlert = { drug: Drug; batch: string | null; expiredAt: string; qty: number };

type AlertsData = {
  outOfStock: OutOfStockAlert[];
  lowStock: LowStockAlert[];
  expiringSoon: ExpiringSoonAlert[];
  expired: ExpiredAlert[];
};

export default function PharmacyAlertsPage() {
  const [data, setData] = useState<AlertsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch("/api/pharmacy/alerts");
      if (res.ok) {
        setData(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-[#5A6E8A] dark:text-[#8A9CBA]">
        <Loader2 size={32} className="animate-spin text-[#7C3AED]" />
        <p className="font-bold">Loading pharmacy alerts...</p>
      </div>
    );
  }

  const outOfStockCount = data.outOfStock.length;
  const lowStockCount = data.lowStock.length;
  const expiringSoonCount = data.expiringSoon.length;
  const expiredCount = data.expired.length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-black text-[#1A2A4A] dark:text-[#E8EEF8] tracking-tight">Pharmacy Alerts</h1>
        <p className="text-[#5A6E8A] dark:text-[#8A9CBA] font-medium mt-1">
          Review critical inventory warnings, low stock levels, and expiring batches.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Out of Stock */}
        <div className={cn("bg-white dark:bg-[#111C3A] p-5 rounded-3xl border shadow-sm flex items-center gap-4 relative overflow-hidden",
          outOfStockCount > 0 ? "border-red-300 dark:border-red-800" : "border-[#D0DCE8] dark:border-[#1A2A4A]"
        )}>
          {outOfStockCount > 0 && <div className="absolute inset-0 bg-red-500/10 dark:bg-red-500/20" />}
          <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center z-10",
            outOfStockCount > 0 ? "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400" : "bg-gray-100 dark:bg-[#0A122A] text-gray-400"
          )}>
            <PackageX size={22} />
          </div>
          <div className="z-10">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#5A6E8A] dark:text-[#8A9CBA]">Out of Stock</p>
            <p className={cn("text-2xl font-black", outOfStockCount > 0 ? "text-red-700 dark:text-red-400" : "text-[#1A2A4A] dark:text-[#E8EEF8]")}>
              {outOfStockCount}
            </p>
          </div>
        </div>

        {/* Low Stock */}
        <div className={cn("bg-white dark:bg-[#111C3A] p-5 rounded-3xl border shadow-sm flex items-center gap-4 relative overflow-hidden",
          lowStockCount > 0 ? "border-orange-300 dark:border-orange-800" : "border-[#D0DCE8] dark:border-[#1A2A4A]"
        )}>
          {lowStockCount > 0 && <div className="absolute inset-0 bg-orange-500/10 dark:bg-orange-500/20" />}
          <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center z-10",
            lowStockCount > 0 ? "bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-400" : "bg-gray-100 dark:bg-[#0A122A] text-gray-400"
          )}>
            <AlertTriangle size={22} />
          </div>
          <div className="z-10">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#5A6E8A] dark:text-[#8A9CBA]">Low Stock</p>
            <p className={cn("text-2xl font-black", lowStockCount > 0 ? "text-orange-700 dark:text-orange-400" : "text-[#1A2A4A] dark:text-[#E8EEF8]")}>
              {lowStockCount}
            </p>
          </div>
        </div>

        {/* Expiring Soon */}
        <div className={cn("bg-white dark:bg-[#111C3A] p-5 rounded-3xl border shadow-sm flex items-center gap-4 relative overflow-hidden",
          expiringSoonCount > 0 ? "border-amber-300 dark:border-amber-800" : "border-[#D0DCE8] dark:border-[#1A2A4A]"
        )}>
          {expiringSoonCount > 0 && <div className="absolute inset-0 bg-amber-400/10 dark:bg-amber-400/20" />}
          <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center z-10",
            expiringSoonCount > 0 ? "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400" : "bg-gray-100 dark:bg-[#0A122A] text-gray-400"
          )}>
            <Clock size={22} />
          </div>
          <div className="z-10">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#5A6E8A] dark:text-[#8A9CBA]">Expiring Soon</p>
            <p className={cn("text-2xl font-black", expiringSoonCount > 0 ? "text-amber-700 dark:text-amber-400" : "text-[#1A2A4A] dark:text-[#E8EEF8]")}>
              {expiringSoonCount}
            </p>
          </div>
        </div>

        {/* Expired */}
        <div className={cn("bg-white dark:bg-[#111C3A] p-5 rounded-3xl border shadow-sm flex items-center gap-4 relative overflow-hidden",
          expiredCount > 0 ? "border-rose-300 dark:border-rose-800" : "border-[#D0DCE8] dark:border-[#1A2A4A]"
        )}>
          {expiredCount > 0 && <div className="absolute inset-0 bg-rose-500/10 dark:bg-rose-500/20" />}
          <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center z-10",
            expiredCount > 0 ? "bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-400" : "bg-gray-100 dark:bg-[#0A122A] text-gray-400"
          )}>
            <ShieldAlert size={22} />
          </div>
          <div className="z-10">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#5A6E8A] dark:text-[#8A9CBA]">Expired</p>
            <p className={cn("text-2xl font-black", expiredCount > 0 ? "text-rose-700 dark:text-rose-400" : "text-[#1A2A4A] dark:text-[#E8EEF8]")}>
              {expiredCount}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* Left Column: Stock Alerts */}
        <div className="space-y-8">
          
          {/* Out of Stock Section */}
          <section className="bg-white dark:bg-[#111C3A] rounded-[2rem] border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-sm overflow-hidden">
            <div className="p-5 border-b border-[#D0DCE8] dark:border-[#1A2A4A] bg-[#F8FAFC] dark:bg-[#0A122A] flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 flex items-center justify-center">
                <PackageX size={16} />
              </div>
              <h2 className="font-bold text-[#1A2A4A] dark:text-[#E8EEF8]">Out of Stock</h2>
              <span className="ml-auto px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                {outOfStockCount}
              </span>
            </div>
            {outOfStockCount === 0 ? (
              <div className="p-8 text-center text-sm text-[#5A6E8A] dark:text-[#8A9CBA]">No out-of-stock items.</div>
            ) : (
              <ul className="divide-y divide-[#F0F4F8] dark:divide-[#1A2A4A]">
                {data.outOfStock.map((alert, i) => (
                  <li key={i} className="p-4 flex items-center justify-between">
                    <span className="font-bold text-[#1A2A4A] dark:text-[#E8EEF8]">{alert.drug.name}</span>
                    <span className="text-xs font-bold px-2 py-1 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-lg uppercase tracking-wider">
                      Requires Restock
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Low Stock Section */}
          <section className="bg-white dark:bg-[#111C3A] rounded-[2rem] border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-sm overflow-hidden">
            <div className="p-5 border-b border-[#D0DCE8] dark:border-[#1A2A4A] bg-[#F8FAFC] dark:bg-[#0A122A] flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 flex items-center justify-center">
                <AlertTriangle size={16} />
              </div>
              <h2 className="font-bold text-[#1A2A4A] dark:text-[#E8EEF8]">Low Stock</h2>
              <span className="ml-auto px-2 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                {lowStockCount}
              </span>
            </div>
            {lowStockCount === 0 ? (
              <div className="p-8 text-center text-sm text-[#5A6E8A] dark:text-[#8A9CBA]">All item stocks are optimal.</div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="bg-[#F8FAFC] dark:bg-[#0A122A] text-[10px] uppercase text-[#5A6E8A] dark:text-[#8A9CBA]">
                  <tr>
                    <th className="px-4 py-3 font-bold">Drug</th>
                    <th className="px-4 py-3 font-bold text-center">Current</th>
                    <th className="px-4 py-3 font-bold text-center">Min</th>
                    <th className="px-4 py-3 font-bold text-center">Deficit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F4F8] dark:divide-[#1A2A4A]">
                  {data.lowStock.map((alert, i) => (
                    <tr key={i} className="hover:bg-[#F8FAFC] dark:hover:bg-[#0A122A]/50 transition-colors">
                      <td className="px-4 py-3 font-bold text-[#1A2A4A] dark:text-[#E8EEF8]">{alert.drug.name}</td>
                      <td className="px-4 py-3 text-center font-black text-orange-600 dark:text-orange-400">
                        {alert.totalStock} <span className="text-xs font-medium text-[#5A6E8A]">{alert.drug.unit}</span>
                      </td>
                      <td className="px-4 py-3 text-center text-[#5A6E8A] dark:text-[#8A9CBA]">{alert.reorderLevel}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-1 bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400 rounded-lg text-xs font-bold">
                          -{alert.deficit}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>

        {/* Right Column: Expiry Alerts */}
        <div className="space-y-8">
          
          {/* Expired Section */}
          <section className="bg-white dark:bg-[#111C3A] rounded-[2rem] border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-sm overflow-hidden">
            <div className="p-5 border-b border-[#D0DCE8] dark:border-[#1A2A4A] bg-[#F8FAFC] dark:bg-[#0A122A] flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 flex items-center justify-center">
                <ShieldAlert size={16} />
              </div>
              <h2 className="font-bold text-[#1A2A4A] dark:text-[#E8EEF8]">Expired Batches</h2>
              <span className="ml-auto px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">
                {expiredCount}
              </span>
            </div>
            {expiredCount === 0 ? (
              <div className="p-8 text-center text-sm text-[#5A6E8A] dark:text-[#8A9CBA]">No expired batches.</div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="bg-[#F8FAFC] dark:bg-[#0A122A] text-[10px] uppercase text-[#5A6E8A] dark:text-[#8A9CBA]">
                  <tr>
                    <th className="px-4 py-3 font-bold">Drug & Batch</th>
                    <th className="px-4 py-3 font-bold text-center">Qty</th>
                    <th className="px-4 py-3 font-bold text-right">Expired At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F4F8] dark:divide-[#1A2A4A]">
                  {data.expired.map((alert, i) => (
                    <tr key={i} className="hover:bg-[#F8FAFC] dark:hover:bg-[#0A122A]/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-bold text-[#1A2A4A] dark:text-[#E8EEF8]">{alert.drug.name}</div>
                        <div className="text-xs text-[#5A6E8A] dark:text-[#8A9CBA] font-mono mt-0.5">{alert.batch || "No batch #"}</div>
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-rose-600 dark:text-rose-400">{alert.qty}</td>
                      <td className="px-4 py-3 text-right text-rose-600 dark:text-rose-400 font-medium">
                        {format(new Date(alert.expiredAt), "MMM dd, yyyy")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {/* Expiring Soon Section */}
          <section className="bg-white dark:bg-[#111C3A] rounded-[2rem] border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-sm overflow-hidden">
            <div className="p-5 border-b border-[#D0DCE8] dark:border-[#1A2A4A] bg-[#F8FAFC] dark:bg-[#0A122A] flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 flex items-center justify-center">
                <Clock size={16} />
              </div>
              <h2 className="font-bold text-[#1A2A4A] dark:text-[#E8EEF8]">Expiring Within 30 Days</h2>
              <span className="ml-auto px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                {expiringSoonCount}
              </span>
            </div>
            {expiringSoonCount === 0 ? (
              <div className="p-8 text-center text-sm text-[#5A6E8A] dark:text-[#8A9CBA]">No batches expiring soon.</div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="bg-[#F8FAFC] dark:bg-[#0A122A] text-[10px] uppercase text-[#5A6E8A] dark:text-[#8A9CBA]">
                  <tr>
                    <th className="px-4 py-3 font-bold">Drug & Batch</th>
                    <th className="px-4 py-3 font-bold text-center">Qty</th>
                    <th className="px-4 py-3 font-bold text-right">Time Left</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F4F8] dark:divide-[#1A2A4A]">
                  {data.expiringSoon
                    .sort((a, b) => a.daysLeft - b.daysLeft)
                    .map((alert, i) => {
                      const isCritical = alert.daysLeft <= 7;
                      const isWarning = alert.daysLeft > 7 && alert.daysLeft <= 14;

                      return (
                        <tr key={i} className="hover:bg-[#F8FAFC] dark:hover:bg-[#0A122A]/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-bold text-[#1A2A4A] dark:text-[#E8EEF8]">{alert.drug.name}</div>
                            <div className="text-xs text-[#5A6E8A] dark:text-[#8A9CBA] font-mono mt-0.5">{alert.batch || "No batch #"}</div>
                          </td>
                          <td className="px-4 py-3 text-center font-bold text-[#1A2A4A] dark:text-[#E8EEF8]">{alert.qty}</td>
                          <td className="px-4 py-3 text-right">
                            <span className={cn(
                              "px-2 py-1 rounded-lg text-xs font-bold",
                              isCritical ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400" :
                              isWarning ? "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400" :
                              "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400"
                            )}>
                              {alert.daysLeft === 0 ? "Today" : `${alert.daysLeft} days`}
                            </span>
                            <div className="text-[10px] text-[#5A6E8A] dark:text-[#8A9CBA] mt-1 font-medium">
                              {format(new Date(alert.expiryDate), "MMM dd")}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
