"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { format, subDays } from "date-fns";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import { Download, DollarSign, FileText, CheckCircle, AlertCircle } from "lucide-react";

export default function AdminReportsPage() {
  const [activeTab, setActiveTab] = useState("Revenue");
  const [from, setFrom] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"));
  const [to, setTo] = useState(format(new Date(), "yyyy-MM-dd"));
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/revenue?from=${from}&to=${to}`);
      if (res.ok) setData(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const COLORS = ['#1E4A8A', '#0F766E', '#D97706', '#B91C1C', '#6D28D9', '#0369A1'];

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-black text-[#1A2A4A] dark:text-[#E8EEF8] tracking-tight">Reports & Analytics</h1>
            <p className="text-[#5A6E8A] dark:text-[#8A9CBA] font-medium">Comprehensive financial and operational insights.</p>
          </div>
          
          {activeTab === "Revenue" && (
            <div className="flex items-end gap-3 bg-white dark:bg-[#111C3A] p-2 rounded-2xl border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-sm">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-[#5A6E8A] dark:text-[#8A9CBA] px-2">From</label>
                <input 
                  type="date" 
                  value={from} 
                  onChange={(e) => setFrom(e.target.value)}
                  className="px-3 py-2 bg-[#F0F4F8] dark:bg-[#0A122A] text-sm font-bold text-[#1A2A4A] dark:text-[#E8EEF8] rounded-xl border-none focus:ring-0"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-[#5A6E8A] dark:text-[#8A9CBA] px-2">To</label>
                <input 
                  type="date" 
                  value={to} 
                  onChange={(e) => setTo(e.target.value)}
                  className="px-3 py-2 bg-[#F0F4F8] dark:bg-[#0A122A] text-sm font-bold text-[#1A2A4A] dark:text-[#E8EEF8] rounded-xl border-none focus:ring-0"
                />
              </div>
              <button 
                onClick={fetchReport}
                className="px-4 py-2 bg-[#1E4A8A] hover:bg-[#16386b] text-white font-bold rounded-xl h-9"
              >
                Apply
              </button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#D0DCE8] dark:border-[#1A2A4A]">
          {["Revenue", "Appointments", "Departments"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-8 py-4 text-sm font-bold transition-colors ${activeTab === tab ? "text-[#1E4A8A] dark:text-[#4A8AC8] border-b-2 border-[#1E4A8A] dark:border-[#4A8AC8] bg-[#F0F4F8]/50 dark:bg-[#0A122A]/50" : "text-[#5A6E8A] dark:text-[#8A9CBA] hover:bg-[#F0F4F8] dark:hover:bg-[#0A122A]"}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "Revenue" && (
          loading || !data ? (
            <div className="h-64 flex items-center justify-center text-[#5A6E8A]">Loading revenue data...</div>
          ) : (
            <div className="space-y-8 animate-in fade-in duration-300">
              
              <div className="flex justify-end">
                <button 
                  onClick={() => window.open(`/api/reports/export?type=revenue&from=${from}&to=${to}`, '_blank')}
                  className="flex items-center gap-2 px-4 py-2 bg-[#F0F4F8] dark:bg-[#111C3A] text-[#1A2A4A] dark:text-[#E8EEF8] hover:bg-[#E2E8F0] dark:hover:bg-[#1A2A4A] font-bold text-sm rounded-xl border border-[#D0DCE8] dark:border-[#2A3A5A] transition-colors"
                >
                  <Download size={16} /> Export CSV
                </button>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-[#111C3A] p-6 rounded-[2rem] border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-sm">
                  <div className="flex items-center gap-3 text-[#5A6E8A] dark:text-[#8A9CBA] mb-2">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl"><FileText size={18} /></div>
                    <span className="text-xs font-black uppercase tracking-widest">Total Invoiced</span>
                  </div>
                  <h3 className="text-3xl font-black text-[#1A2A4A] dark:text-[#E8EEF8]">
                    ETB {data.summary.totalInvoiced.toLocaleString()}
                  </h3>
                </div>

                <div className="bg-white dark:bg-[#111C3A] p-6 rounded-[2rem] border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-sm">
                  <div className="flex items-center gap-3 text-[#5A6E8A] dark:text-[#8A9CBA] mb-2">
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl"><DollarSign size={18} /></div>
                    <span className="text-xs font-black uppercase tracking-widest">Total Collected</span>
                  </div>
                  <h3 className="text-3xl font-black text-[#1A2A4A] dark:text-[#E8EEF8]">
                    ETB {data.summary.totalCollected.toLocaleString()}
                  </h3>
                </div>

                <div className="bg-white dark:bg-[#111C3A] p-6 rounded-[2rem] border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-sm">
                  <div className="flex items-center gap-3 text-[#5A6E8A] dark:text-[#8A9CBA] mb-2">
                    <div className="p-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-xl"><AlertCircle size={18} /></div>
                    <span className="text-xs font-black uppercase tracking-widest">Outstanding</span>
                  </div>
                  <h3 className="text-3xl font-black text-[#1A2A4A] dark:text-[#E8EEF8]">
                    ETB {data.summary.totalOutstanding.toLocaleString()}
                  </h3>
                </div>

                <div className="bg-white dark:bg-[#111C3A] p-6 rounded-[2rem] border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-sm">
                  <div className="flex items-center gap-3 text-[#5A6E8A] dark:text-[#8A9CBA] mb-2">
                    <div className="p-2 bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 rounded-xl"><CheckCircle size={18} /></div>
                    <span className="text-xs font-black uppercase tracking-widest">Paid Invoices</span>
                  </div>
                  <h3 className="text-3xl font-black text-[#1A2A4A] dark:text-[#E8EEF8]">
                    {data.summary.paidCount} <span className="text-base text-[#5A6E8A] font-medium">/ {data.summary.invoiceCount}</span>
                  </h3>
                </div>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-[#111C3A] p-6 sm:p-8 rounded-[2.5rem] border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-sm">
                  <h3 className="font-bold text-[#1A2A4A] dark:text-[#E8EEF8] mb-6">Daily Revenue Trends</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.dailyRevenue} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#D0DCE8" opacity={0.5} />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#5A6E8A' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#5A6E8A' }} />
                        <RechartsTooltip 
                          cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                          contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                        />
                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                        <Bar dataKey="invoiced" name="Invoiced" fill="#1E4A8A" radius={[4, 4, 0, 0]} maxBarSize={40} />
                        <Bar dataKey="collected" name="Collected" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#111C3A] p-6 sm:p-8 rounded-[2.5rem] border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-sm flex flex-col">
                  <h3 className="font-bold text-[#1A2A4A] dark:text-[#E8EEF8] mb-2">By Payment Method</h3>
                  <div className="flex-1 flex items-center justify-center min-h-[250px]">
                    {data.byPaymentMethod.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={data.byPaymentMethod}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="amount"
                            nameKey="method"
                          >
                            {data.byPaymentMethod.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip 
                            formatter={(value: any) => [`ETB ${Number(value).toLocaleString()}`, 'Amount']}
                            contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                          />
                          <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-[#5A6E8A] text-sm">No payment data available.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="bg-white dark:bg-[#111C3A] rounded-[2.5rem] border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-sm overflow-hidden">
                <div className="p-6 sm:p-8 border-b border-[#D0DCE8] dark:border-[#1A2A4A]">
                  <h3 className="font-bold text-[#1A2A4A] dark:text-[#E8EEF8]">Revenue by Service Category</h3>
                </div>
                <div className="overflow-x-auto p-4 sm:p-8 pt-0">
                  <table className="w-full text-sm text-left">
                    <thead className="text-[10px] text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-widest border-b border-[#D0DCE8] dark:border-[#1A2A4A]">
                      <tr>
                        <th className="px-4 py-4">Category</th>
                        <th className="px-4 py-4 text-right">Total Amount (ETB)</th>
                        <th className="px-4 py-4 text-right">% of Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.byCategory.sort((a:any,b:any) => b.amount - a.amount).map((cat: any, i: number) => (
                        <tr key={i} className="border-b border-[#D0DCE8] dark:border-[#1A2A4A] hover:bg-[#F0F4F8]/50 dark:hover:bg-[#0A122A]/50 transition-colors">
                          <td className="px-4 py-4 font-bold text-[#1A2A4A] dark:text-[#E8EEF8]">{cat.category.replace(/_/g, ' ')}</td>
                          <td className="px-4 py-4 text-right text-[#1A2A4A] dark:text-[#E8EEF8]">ETB {cat.amount.toLocaleString()}</td>
                          <td className="px-4 py-4 text-right text-[#5A6E8A] dark:text-[#8A9CBA]">
                            {data.summary.totalInvoiced > 0 ? ((cat.amount / data.summary.totalInvoiced) * 100).toFixed(1) : 0}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
            </div>
          )
        )}

        {activeTab !== "Revenue" && (
          <div className="bg-white dark:bg-[#111C3A] p-12 rounded-[2.5rem] border border-[#D0DCE8] dark:border-[#1A2A4A] text-center shadow-sm">
            <h3 className="font-bold text-[#1A2A4A] dark:text-[#E8EEF8] text-xl mb-2">{activeTab} Report</h3>
            <p className="text-[#5A6E8A] dark:text-[#8A9CBA]">This report module is currently under development.</p>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
