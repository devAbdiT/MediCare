// app/dashboard/patient/invoices/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { 
  ClipboardList, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Calendar,
  CreditCard,
  User,
  Clock,
  DollarSign
} from "lucide-react";
import { toast } from "sonner";

export default function PatientInvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedInvoices, setExpandedInvoices] = useState<{ [key: string]: boolean }>({});

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/billing/invoices/my");
      if (res.ok) {
        const data = await res.json();
        setInvoices(data);
      } else {
        toast.error("Failed to load your invoice history");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while loading invoices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedInvoices(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Summaries
  const totalInvoices = invoices.length;
  const totalBilled = invoices.reduce((acc, inv) => acc + Number(inv.totalAmount), 0);
  const totalPaid = invoices.reduce((acc, inv) => acc + Number(inv.paidAmount), 0);
  const outstanding = Math.max(0, totalBilled - totalPaid);

  return (
    <DashboardLayout role="patient">
      <div className="space-y-8 pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-[#111C3A] p-8 rounded-[2.5rem] border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-sm transition-colors duration-500">
          <div className="flex items-center gap-4">
            <div className="w-1.5 h-10 bg-[#1E4A8A] dark:bg-[#4A8AC8] rounded-full" />
            <div>
              <h1 className="text-4xl font-black text-[#1A2A4A] dark:text-[#E8EEF8] tracking-tight">My Invoices</h1>
              <p className="text-[#5A6E8A] dark:text-[#8A9CBA] font-medium mt-1">Review your consultation statements and payments history.</p>
            </div>
          </div>
        </div>

        {/* Summary Dashboard Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <SummaryCard title="Total Statements" value={totalInvoices.toString()} label="Issued Invoices" icon={<ClipboardList className="text-blue-500" />} />
          <SummaryCard title="Total Billed" value={`ETB ${totalBilled.toFixed(2)}`} label="Overall Charges" icon={<DollarSign className="text-indigo-500" />} />
          <SummaryCard title="Total Paid" value={`ETB ${totalPaid.toFixed(2)}`} label="Settled Amount" icon={<CheckCircle2 className="text-emerald-500" />} />
          <SummaryCard title="Outstanding Balance" value={`ETB ${outstanding.toFixed(2)}`} label="Pending Settlement" icon={<Clock className="text-red-500 animate-pulse" />} />
        </div>

        {/* Invoice list */}
        <div className="space-y-6">
          <h2 className="text-xl font-black text-[#1A2A4A] dark:text-[#E8EEF8] tracking-tight pl-2">Billing History Log</h2>
          
          {loading ? (
            <div className="flex justify-center items-center py-20 bg-white dark:bg-[#111C3A] rounded-[2.5rem] border border-[#D0DCE8] dark:border-[#1A2A4A]">
              <Loader2 className="animate-spin text-[#1E4A8A]" size={40} />
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-[#111C3A] rounded-[2.5rem] border-2 border-dashed border-[#D0DCE8] dark:border-[#1A2A4A]">
              <AlertCircle className="mx-auto text-[#5A6E8A] mb-4" size={40} />
              <p className="text-[#5A6E8A] dark:text-[#8A9CBA] font-bold italic">No invoice records found in your profile.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {invoices.map((inv) => {
                const totalAmt = Number(inv.totalAmount);
                const paidAmt = Number(inv.paidAmount);
                const balance = totalAmt - paidAmt;
                const isExpanded = !!expandedInvoices[inv.id];
                const issueDate = new Date(inv.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric"
                });
                const apptDate = inv.appointment?.dateTime
                  ? new Date(inv.appointment.dateTime).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric"
                    })
                  : "N/A";

                // Find the latest payment date if PAID
                const latestPayment = inv.payments.length > 0
                  ? new Date(Math.max(...inv.payments.map((p: any) => new Date(p.receivedAt).getTime())))
                  : null;

                const latestPaymentStr = latestPayment 
                  ? latestPayment.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
                  : "";

                return (
                  <div 
                    key={inv.id}
                    className="bg-white dark:bg-[#111C3A] border border-[#D0DCE8] dark:border-[#1A2A4A] rounded-[2.5rem] overflow-hidden shadow-sm hover:border-[#1E4A8A] dark:hover:border-[#4A8AC8] transition-all duration-300"
                  >
                    {/* Invoice Card Header Summary */}
                    <div className="p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-lg font-black text-[#1A2A4A] dark:text-white">{inv.invoiceNumber}</span>
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            inv.status === "PAID"
                              ? "bg-green-50 dark:bg-green-950/30 text-[#10B981]"
                              : inv.status === "PARTIAL"
                              ? "bg-amber-50 dark:bg-amber-950/30 text-amber-500"
                              : "bg-red-50 dark:bg-red-950/30 text-red-500"
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              inv.status === "PAID" ? "bg-[#10B981]" : inv.status === "PARTIAL" ? "bg-amber-500" : "bg-red-500 animate-pulse"
                            }`} />
                            {inv.status}
                          </span>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-x-6 gap-y-1 text-xs text-[#5A6E8A] dark:text-[#8A9CBA] font-bold">
                          <span className="flex items-center gap-1"><Calendar size={14} /> Issued: {issueDate}</span>
                          <span className="flex items-center gap-1"><User size={14} /> Doctor: Dr. {inv.appointment?.doctor?.user?.name || "N/A"}</span>
                          <span className="flex items-center gap-1"><Clock size={14} /> Appt Date: {apptDate}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-6">
                        <div className="text-left lg:text-right">
                          <span className="text-[10px] font-black text-[#5A6E8A] uppercase tracking-wider block">Statement Total</span>
                          <span className="text-xl font-black text-[#1A2A4A] dark:text-white">ETB {totalAmt.toFixed(2)}</span>
                        </div>
                        <div className="text-left lg:text-right">
                          <span className="text-[10px] font-black text-[#5A6E8A] uppercase tracking-wider block">Amount Settled</span>
                          <span className="text-xl font-black text-[#10B981]">ETB {paidAmt.toFixed(2)}</span>
                        </div>
                        {inv.status !== "PAID" && (
                          <div className="text-left lg:text-right">
                            <span className="text-[10px] font-black text-[#5A6E8A] uppercase tracking-wider block text-red-500">Balance Due</span>
                            <span className="text-xl font-black text-red-500">ETB {balance.toFixed(2)}</span>
                          </div>
                        )}
                        <button
                          onClick={() => toggleExpand(inv.id)}
                          className="p-3 bg-[#F0F4F8] dark:bg-[#0A122A] hover:bg-[#D0DCE8] dark:hover:bg-[#1A2A4A] text-[#1E4A8A] dark:text-[#4A8AC8] rounded-xl transition-all shadow-sm active:scale-95 flex items-center justify-center shrink-0 ml-auto lg:ml-0"
                          title={isExpanded ? "Collapse Details" : "Expand Details"}
                        >
                          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                      </div>
                    </div>

                    {/* Expandable Breakdown Section */}
                    {isExpanded && (
                      <div className="px-8 pb-8 border-t border-[#F0F4F8] dark:border-[#1A2A4A] bg-[#F8FAFC]/50 dark:bg-[#0E1730]/20 space-y-6 pt-6">
                        {/* Line Items breakdown */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-black text-[#5A6E8A] uppercase tracking-wider">Line Items Breakdown</h4>
                          <div className="overflow-x-auto rounded-2xl border border-[#D0DCE8] dark:border-[#1A2A4A] bg-white dark:bg-[#111C3A]">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-[#F8FAFC] dark:bg-[#0E1730] border-b border-[#D0DCE8] dark:border-[#1A2A4A]">
                                  <th className="p-4 text-[10px] font-black text-[#5A6E8A] uppercase tracking-widest">Item Description</th>
                                  <th className="p-4 text-[10px] font-black text-[#5A6E8A] uppercase tracking-widest text-center w-20">Qty</th>
                                  <th className="p-4 text-[10px] font-black text-[#5A6E8A] uppercase tracking-widest text-right w-32">Unit Price</th>
                                  <th className="p-4 text-[10px] font-black text-[#5A6E8A] uppercase tracking-widest text-right w-32">Total Price</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#F0F4F8] dark:divide-[#1A2A4A]">
                                {inv.lineItems.map((item: any) => (
                                  <tr key={item.id}>
                                    <td className="p-4 text-xs font-bold text-[#1A2A4A] dark:text-white">{item.description}</td>
                                    <td className="p-4 text-xs font-bold text-center">{item.quantity}</td>
                                    <td className="p-4 text-xs font-bold text-right">ETB {Number(item.unitPrice).toFixed(2)}</td>
                                    <td className="p-4 text-xs font-black text-right text-[#1E4A8A] dark:text-[#4A8AC8]">ETB {Number(item.totalPrice).toFixed(2)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Payments Logs */}
                        {inv.payments.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="text-xs font-black text-[#5A6E8A] uppercase tracking-wider">Payment Transactions Registry</h4>
                            <div className="overflow-x-auto rounded-2xl border border-[#D0DCE8] dark:border-[#1A2A4A] bg-white dark:bg-[#111C3A]">
                              <table className="w-full text-left border-collapse">
                                <thead>
                                  <tr className="bg-[#F8FAFC] dark:bg-[#0E1730] border-b border-[#D0DCE8] dark:border-[#1A2A4A]">
                                    <th className="p-4 text-[10px] font-black text-[#5A6E8A] uppercase tracking-widest">Payment Date</th>
                                    <th className="p-4 text-[10px] font-black text-[#5A6E8A] uppercase tracking-widest">Method</th>
                                    <th className="p-4 text-[10px] font-black text-[#5A6E8A] uppercase tracking-widest">Reference Number</th>
                                    <th className="p-4 text-[10px] font-black text-[#5A6E8A] uppercase tracking-widest text-right">Settled</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-[#F0F4F8] dark:divide-[#1A2A4A]">
                                  {inv.payments.map((pay: any) => (
                                    <tr key={pay.id}>
                                      <td className="p-4 text-xs font-bold text-[#1A2A4A] dark:text-white">
                                        {new Date(pay.receivedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                                      </td>
                                      <td className="p-4 text-xs font-bold">
                                        <span className="bg-[#F0F4F8] dark:bg-[#0A122A] px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider text-[#1E4A8A] dark:text-[#4A8AC8]">
                                          {pay.method}
                                        </span>
                                      </td>
                                      <td className="p-4 text-xs font-bold text-slate-500">{pay.reference || "-"}</td>
                                      <td className="p-4 text-xs font-black text-right text-green-500">ETB {Number(pay.amount).toFixed(2)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* Expandable Box Status Footers */}
                        {inv.status === "PAID" ? (
                          <div className="flex items-center gap-2 text-xs font-bold text-green-500 pt-3 border-t border-[#F0F4F8] dark:border-[#1A2A4A]">
                            <CheckCircle2 size={16} />
                            <span>Statement fully settled on {latestPaymentStr}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-xs font-bold text-red-500 pt-3 border-t border-[#F0F4F8] dark:border-[#1A2A4A]">
                            <AlertCircle size={16} className="animate-pulse" />
                            <span>Please pay at reception or online via Chapa</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function SummaryCard({
  title,
  value,
  label,
  icon
}: {
  title: string;
  value: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-[#111C3A] p-8 rounded-[2rem] border border-[#D0DCE8] dark:border-[#1A2A4A] flex items-center justify-between group hover:border-[#1E4A8A] dark:hover:border-[#4A8AC8] transition-all shadow-sm">
      <div className="space-y-1">
        <span className="text-[10px] font-black text-[#5A6E8A] uppercase tracking-wider block">{title}</span>
        <span className="text-2xl font-black text-[#1A2A4A] dark:text-white block tracking-tight">{value}</span>
        <span className="text-[9px] font-bold text-slate-400 block">{label}</span>
      </div>
      <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-[#0A122A] border border-[#D0DCE8] dark:border-[#1A2A4A] flex items-center justify-center text-[#5A6E8A] group-hover:bg-[#1E4A8A]/10 transition-colors">
        {icon}
      </div>
    </div>
  );
}
