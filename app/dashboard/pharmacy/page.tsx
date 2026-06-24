import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Pill, Package, AlertTriangle, Activity, TrendingDown, Clock, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { addDays, startOfDay, endOfDay } from "date-fns";
import { cn } from "@/lib/utils";

export default async function PharmacyDashboard() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    redirect("/login");
  }

  const role = (session.user as any).role;
  if (role !== "PHARMACIST" && role !== "ADMIN") {
    redirect("/login");
  }

  // 1. Total Drugs
  const totalDrugs = await prisma.drug.count({ where: { isActive: true } });

  // 2. Dispensed Today
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());
  const dispensedToday = await prisma.drugDispensing.count({
    where: { dispensedAt: { gte: todayStart, lte: todayEnd } }
  });

  // Calculate stocks and expirations
  const allDrugs = await prisma.drug.findMany({
    where: { isActive: true },
    include: { stocks: true }
  });

  let lowStockCount = 0;
  let expiringSoonCount = 0;
  const thirtyDaysFromNow = addDays(new Date(), 30);

  const lowStockDrugs: any[] = [];
  const expiringDrugs: any[] = [];

  for (const drug of allDrugs) {
    let totalStock = 0;
    
    for (const stock of drug.stocks) {
      totalStock += stock.quantity;
      if (stock.expiryDate && stock.expiryDate <= thirtyDaysFromNow && stock.quantity > 0) {
        expiringSoonCount++;
        expiringDrugs.push({
          drugName: drug.name,
          batch: stock.batchNumber,
          expiry: stock.expiryDate,
          quantity: stock.quantity
        });
      }
    }

    if (totalStock <= drug.reorderLevel) {
      lowStockCount++;
      lowStockDrugs.push({
        id: drug.id,
        name: drug.name,
        totalStock,
        reorderLevel: drug.reorderLevel
      });
    }
  }

  // Sort and take top 5
  lowStockDrugs.sort((a, b) => a.totalStock - b.totalStock);
  const topLowStock = lowStockDrugs.slice(0, 5);

  expiringDrugs.sort((a, b) => a.expiry.getTime() - b.expiry.getTime());
  const topExpiring = expiringDrugs.slice(0, 5);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-black text-[#1A2A4A] dark:text-[#E8EEF8] tracking-tight">Pharmacy Overview</h1>
        <p className="text-[#5A6E8A] dark:text-[#8A9CBA] font-medium mt-1">Welcome back, {(session.user as any).name}. Here is today's snapshot.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-[#111C3A] p-6 rounded-3xl border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Pill size={28} />
          </div>
          <div>
            <p className="text-xs font-bold text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-widest">Total Drugs</p>
            <p className="text-3xl font-black text-[#1A2A4A] dark:text-[#E8EEF8]">{totalDrugs}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111C3A] p-6 rounded-3xl border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Activity size={28} />
          </div>
          <div>
            <p className="text-xs font-bold text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-widest">Dispensed Today</p>
            <p className="text-3xl font-black text-[#1A2A4A] dark:text-[#E8EEF8]">{dispensedToday}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111C3A] p-6 rounded-3xl border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-sm flex items-center gap-4 relative overflow-hidden group">
          {lowStockCount > 0 && <div className="absolute inset-0 bg-red-500/5 dark:bg-red-500/10 transition-colors"></div>}
          <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center z-10", lowStockCount > 0 ? "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400" : "bg-gray-100 dark:bg-[#0A122A] text-gray-500")}>
            <TrendingDown size={28} />
          </div>
          <div className="z-10">
            <p className="text-xs font-bold text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-widest">Low Stock</p>
            <p className={cn("text-3xl font-black", lowStockCount > 0 ? "text-red-600 dark:text-red-400" : "text-[#1A2A4A] dark:text-[#E8EEF8]")}>{lowStockCount}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111C3A] p-6 rounded-3xl border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-sm flex items-center gap-4 relative overflow-hidden">
          {expiringSoonCount > 0 && <div className="absolute inset-0 bg-orange-500/5 dark:bg-orange-500/10"></div>}
          <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center z-10", expiringSoonCount > 0 ? "bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400" : "bg-gray-100 dark:bg-[#0A122A] text-gray-500")}>
            <Clock size={28} />
          </div>
          <div className="z-10">
            <p className="text-xs font-bold text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-widest">Expiring &lt;30D</p>
            <p className={cn("text-3xl font-black", expiringSoonCount > 0 ? "text-orange-600 dark:text-orange-400" : "text-[#1A2A4A] dark:text-[#E8EEF8]")}>{expiringSoonCount}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-[#111C3A] rounded-[2rem] border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-sm overflow-hidden">
          <div className="p-6 border-b border-[#D0DCE8] dark:border-[#1A2A4A] flex justify-between items-center bg-[#F8FAFC] dark:bg-[#0A122A]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-xl flex items-center justify-center">
                <AlertTriangle size={20} />
              </div>
              <h2 className="text-lg font-bold text-[#1A2A4A] dark:text-[#E8EEF8]">Low Stock Alerts</h2>
            </div>
            <Link href="/dashboard/pharmacy/stock" className="text-sm font-bold text-[#7C3AED] hover:underline">Manage Stock</Link>
          </div>
          <div className="p-0">
            {topLowStock.length === 0 ? (
              <div className="p-10 text-center text-[#5A6E8A]">All stock levels are optimal.</div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="bg-[#F8FAFC] dark:bg-[#0A122A] text-xs uppercase text-[#5A6E8A] dark:text-[#8A9CBA] border-b border-[#D0DCE8] dark:border-[#1A2A4A]">
                  <tr>
                    <th className="px-6 py-3 font-bold">Drug Name</th>
                    <th className="px-6 py-3 font-bold text-right">Current Stock</th>
                    <th className="px-6 py-3 font-bold text-right">Min Level</th>
                  </tr>
                </thead>
                <tbody>
                  {topLowStock.map((drug) => (
                    <tr key={drug.id} className="border-b border-[#F0F4F8] dark:border-[#1A2A4A]">
                      <td className="px-6 py-4 font-bold text-[#1A2A4A] dark:text-[#E8EEF8]">{drug.name}</td>
                      <td className="px-6 py-4 text-right font-black text-red-600 dark:text-red-400">{drug.totalStock}</td>
                      <td className="px-6 py-4 text-right text-[#5A6E8A] dark:text-[#8A9CBA]">{drug.reorderLevel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-[#111C3A] rounded-[2rem] border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-sm overflow-hidden">
          <div className="p-6 border-b border-[#D0DCE8] dark:border-[#1A2A4A] flex justify-between items-center bg-[#F8FAFC] dark:bg-[#0A122A]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 rounded-xl flex items-center justify-center">
                <ShieldAlert size={20} />
              </div>
              <h2 className="text-lg font-bold text-[#1A2A4A] dark:text-[#E8EEF8]">Expiring Soon</h2>
            </div>
            <Link href="/dashboard/pharmacy/stock" className="text-sm font-bold text-[#7C3AED] hover:underline">View All</Link>
          </div>
          <div className="p-0">
            {topExpiring.length === 0 ? (
              <div className="p-10 text-center text-[#5A6E8A]">No batches expiring within 30 days.</div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="bg-[#F8FAFC] dark:bg-[#0A122A] text-xs uppercase text-[#5A6E8A] dark:text-[#8A9CBA] border-b border-[#D0DCE8] dark:border-[#1A2A4A]">
                  <tr>
                    <th className="px-6 py-3 font-bold">Drug Name</th>
                    <th className="px-6 py-3 font-bold">Batch</th>
                    <th className="px-6 py-3 font-bold text-right">Expiry Date</th>
                  </tr>
                </thead>
                <tbody>
                  {topExpiring.map((drug, i) => (
                    <tr key={i} className="border-b border-[#F0F4F8] dark:border-[#1A2A4A]">
                      <td className="px-6 py-4 font-bold text-[#1A2A4A] dark:text-[#E8EEF8]">{drug.drugName}</td>
                      <td className="px-6 py-4 text-[#5A6E8A] dark:text-[#8A9CBA]">{drug.batch || "N/A"}</td>
                      <td className="px-6 py-4 text-right font-bold text-orange-600 dark:text-orange-400">
                        {drug.expiry.toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
