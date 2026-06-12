// app/dashboard/receptionist/billing/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { 
  ClipboardList, 
  Search, 
  Plus, 
  Printer, 
  CreditCard, 
  Loader2, 
  AlertCircle, 
  Calendar, 
  DollarSign, 
  CheckCircle,
  Clock
} from "lucide-react";
import { toast } from "sonner";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription
} from "@/components/ui/dialog";

export default function ReceptionistBillingPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<"ALL" | "PENDING" | "PARTIAL" | "PAID">("ALL");
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Payment Recording State
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "CHAPA" | "INSURANCE">("CASH");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedTab !== "ALL") {
        params.append("status", selectedTab);
      }
      if (fromDate) {
        params.append("from", fromDate);
      }
      if (toDate) {
        params.append("to", toDate);
      }

      const res = await fetch(`/api/billing/invoices?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setInvoices(data);
      } else {
        toast.error("Failed to load invoices");
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
  }, [selectedTab, fromDate, toDate]);

  const handleOpenPayment = (invoice: any) => {
    setSelectedInvoice(invoice);
    const balance = Number(invoice.totalAmount) - Number(invoice.paidAmount);
    setPaymentAmount(balance.toFixed(2));
    setPaymentMethod("CASH");
    setPaymentReference("");
    setPaymentNotes("");
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    const amount = parseFloat(paymentAmount);
    const balance = Number(selectedInvoice.totalAmount) - Number(selectedInvoice.paidAmount);

    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (amount > balance) {
      toast.error("Payment amount cannot exceed the remaining balance");
      return;
    }

    setSubmittingPayment(true);
    try {
      const res = await fetch("/api/billing/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: selectedInvoice.id,
          amount,
          method: paymentMethod,
          reference: paymentReference,
          notes: paymentNotes
        })
      });

      if (res.ok) {
        toast.success("Payment recorded successfully!");
        setSelectedInvoice(null);
        fetchInvoices();
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to record payment");
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
    } finally {
      setSubmittingPayment(false);
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    const patientName = inv.patient?.user?.name?.toLowerCase() || "";
    const doctorName = inv.appointment?.doctor?.user?.name?.toLowerCase() || "";
    const invoiceNum = inv.invoiceNumber?.toLowerCase() || "";
    const query = searchQuery.toLowerCase();
    return patientName.includes(query) || doctorName.includes(query) || invoiceNum.includes(query);
  });

  return (
    <DashboardLayout role="receptionist">
      <div className="space-y-8 pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-[#111C3A] p-8 rounded-[2.5rem] border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-sm transition-colors duration-500">
          <div className="flex items-center gap-4">
            <div className="w-1.5 h-10 bg-[#1E4A8A] dark:bg-[#4A8AC8] rounded-full" />
            <div>
              <h1 className="text-4xl font-black text-[#1A2A4A] dark:text-[#E8EEF8] tracking-tight">Billing & Payments</h1>
              <p className="text-[#5A6E8A] dark:text-[#8A9CBA] font-medium mt-1">Invoice tracking, payments registry and prints portal.</p>
            </div>
          </div>
        </div>

        {/* Filters and Tabs */}
        <div className="bg-white dark:bg-[#111C3A] p-8 rounded-[2.5rem] border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-sm space-y-6 transition-colors duration-500">
          <div className="flex flex-col lg:flex-row justify-between gap-4">
            {/* Search Input */}
            <div className="flex items-center gap-4 bg-[#F0F4F8] dark:bg-[#0A122A] px-5 py-3.5 rounded-2xl border border-transparent focus-within:border-[#1E4A8A] dark:focus-within:border-[#4A8AC8] shadow-inner w-full lg:w-96 transition-all">
              <Search size={18} className="text-[#5A6E8A] dark:text-[#8A9CBA]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Invoice #, Patient or Doctor..."
                className="bg-transparent border-none outline-none text-sm font-bold text-[#1A2A4A] dark:text-[#E8EEF8] w-full placeholder:text-[#5A6E8A] dark:placeholder:text-[#8A9CBA]"
              />
            </div>

            {/* Date Filters */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-[#5A6E8A] uppercase tracking-wider">From</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="p-3 bg-[#F0F4F8] dark:bg-[#0A122A] border border-transparent rounded-xl text-xs font-bold text-[#1A2A4A] dark:text-[#E8EEF8] outline-none focus:border-[#1E4A8A] dark:focus:border-[#4A8AC8]"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-[#5A6E8A] uppercase tracking-wider">To</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="p-3 bg-[#F0F4F8] dark:bg-[#0A122A] border border-transparent rounded-xl text-xs font-bold text-[#1A2A4A] dark:text-[#E8EEF8] outline-none focus:border-[#1E4A8A] dark:focus:border-[#4A8AC8]"
                />
              </div>
              {(fromDate || toDate) && (
                <button
                  onClick={() => { setFromDate(""); setToDate(""); }}
                  className="px-4 py-2 text-xs font-black text-[#D94A5A] hover:bg-[#D94A5A]/10 rounded-lg transition-colors uppercase tracking-wider"
                >
                  Clear Date
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex border-b border-[#D0DCE8] dark:border-[#1A2A4A]">
            {(["ALL", "PENDING", "PARTIAL", "PAID"] as const).map((tab) => {
              const isActive = selectedTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setSelectedTab(tab)}
                  className={`px-6 py-4 font-black text-sm uppercase tracking-widest border-b-2 transition-all relative ${
                    isActive
                      ? "border-[#1E4A8A] text-[#1E4A8A] dark:border-[#4A8AC8] dark:text-[#4A8AC8]"
                      : "border-transparent text-[#5A6E8A] hover:text-[#1E4A8A] dark:hover:text-[#4A8AC8]"
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </div>

        {/* Invoices Manifest */}
        <div className="bg-[#F0F4F8] dark:bg-[#0A122A] rounded-[3rem] border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-sm overflow-hidden transition-colors duration-500">
          <div className="p-8 border-b border-[#D0DCE8] dark:border-[#1A2A4A] bg-white dark:bg-[#111C3A] flex items-center justify-between">
            <h2 className="text-2xl font-black text-[#1A2A4A] dark:text-[#E8EEF8] tracking-tight">Billing Manifesto</h2>
            <span className="px-4 py-2 bg-[#F0F4F8] dark:bg-[#0A122A] rounded-xl font-black text-xs text-[#5A6E8A]">
              Showing {filteredInvoices.length} entries
            </span>
          </div>

          <div className="p-8">
            {loading ? (
              <div className="flex justify-center items-center py-20 bg-white dark:bg-[#111C3A] rounded-[2.5rem]">
                <Loader2 className="animate-spin text-[#1E4A8A]" size={40} />
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-[#111C3A] rounded-[2.5rem] border-2 border-dashed border-[#D0DCE8] dark:border-[#1A2A4A]">
                <AlertCircle className="mx-auto text-[#5A6E8A] mb-4" size={40} />
                <p className="text-[#5A6E8A] dark:text-[#8A9CBA] font-bold italic">No matching invoices found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-[2rem] bg-white dark:bg-[#111C3A] border border-[#D0DCE8] dark:border-[#1A2A4A]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F8FAFC] dark:bg-[#0E1730] border-b border-[#D0DCE8] dark:border-[#1A2A4A]">
                      <th className="p-6 text-xs font-black text-[#5A6E8A] uppercase tracking-widest">Invoice #</th>
                      <th className="p-6 text-xs font-black text-[#5A6E8A] uppercase tracking-widest">Patient</th>
                      <th className="p-6 text-xs font-black text-[#5A6E8A] uppercase tracking-widest">Appt Date</th>
                      <th className="p-6 text-xs font-black text-[#5A6E8A] uppercase tracking-widest">Doctor</th>
                      <th className="p-6 text-xs font-black text-[#5A6E8A] uppercase tracking-widest">Total</th>
                      <th className="p-6 text-xs font-black text-[#5A6E8A] uppercase tracking-widest">Paid</th>
                      <th className="p-6 text-xs font-black text-[#5A6E8A] uppercase tracking-widest">Balance</th>
                      <th className="p-6 text-xs font-black text-[#5A6E8A] uppercase tracking-widest text-center">Status</th>
                      <th className="p-6 text-xs font-black text-[#5A6E8A] uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0F4F8] dark:divide-[#1A2A4A]">
                    {filteredInvoices.map((inv) => {
                      const totalAmt = Number(inv.totalAmount);
                      const paidAmt = Number(inv.paidAmount);
                      const balance = totalAmt - paidAmt;
                      const apptDate = inv.appointment?.dateTime ? new Date(inv.appointment.dateTime) : null;

                      return (
                        <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                          <td className="p-6 text-sm font-black text-[#1E4A8A] dark:text-[#4A8AC8]">{inv.invoiceNumber}</td>
                          <td className="p-6">
                            <p className="text-sm font-bold text-[#1A2A4A] dark:text-[#E8EEF8]">{inv.patient?.user?.name}</p>
                            <p className="text-[10px] text-[#5A6E8A] dark:text-[#8A9CBA] font-medium">Card: {inv.patient?.cardNumber || "N/A"}</p>
                          </td>
                          <td className="p-6 text-sm font-bold text-[#1A2A4A] dark:text-[#E8EEF8]">
                            {apptDate ? apptDate.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "-"}
                          </td>
                          <td className="p-6 text-sm font-bold text-[#1A2A4A] dark:text-[#E8EEF8]">
                            Dr. {inv.appointment?.doctor?.user?.name || "N/A"}
                          </td>
                          <td className="p-6 text-sm font-black text-[#1A2A4A] dark:text-[#E8EEF8]">ETB {totalAmt.toFixed(2)}</td>
                          <td className="p-6 text-sm font-bold text-[#10B981]">ETB {paidAmt.toFixed(2)}</td>
                          <td className="p-6 text-sm font-black text-[#D94A5A]">ETB {Math.max(0, balance).toFixed(2)}</td>
                          <td className="p-6 text-center">
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
                          </td>
                          <td className="p-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Record Payment */}
                              <button
                                disabled={inv.status === "PAID"}
                                onClick={() => handleOpenPayment(inv)}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                                  inv.status === "PAID"
                                    ? "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed"
                                    : "bg-[#1E4A8A] hover:bg-[#163C70] text-white shadow-md shadow-[#1E4A8A]/10 active:scale-95"
                                }`}
                              >
                                <CreditCard size={14} />
                                Pay
                              </button>

                              {/* Print Receipt */}
                              <a
                                href={`/api/billing/invoices/${inv.id}/receipt`}
                                target="_blank"
                                rel="noreferrer"
                                className={`flex items-center gap-1.5 px-4 py-2 border rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                                  inv.status === "PENDING"
                                    ? "border-slate-200 text-slate-400 dark:border-slate-800 dark:text-slate-600 pointer-events-none cursor-not-allowed"
                                    : "border-[#D0DCE8] dark:border-[#1A2A4A] text-[#1E4A8A] dark:text-[#4A8AC8] hover:bg-slate-50 dark:hover:bg-slate-800/30 active:scale-95"
                                }`}
                              >
                                <Printer size={14} />
                                Print
                              </a>
                            </div>
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

      {/* Record Payment Dialog */}
      <Dialog open={!!selectedInvoice} onOpenChange={(open) => { if (!open) setSelectedInvoice(null); }}>
        <DialogContent className="bg-white dark:bg-[#111C3A] border-none rounded-[2rem] max-w-md p-8 shadow-2xl">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-2xl font-black text-[#1A2A4A] dark:text-white flex items-center gap-2">
              <DollarSign className="text-[#10B981]" />
              Record Payment
            </DialogTitle>
            <DialogDescription className="text-xs font-bold text-[#5A6E8A] dark:text-[#8A9CBA]">
              Collect and confirm payment details against this invoice.
            </DialogDescription>
          </DialogHeader>

          {selectedInvoice && (
            <form onSubmit={handleRecordPayment} className="space-y-6 mt-6">
              {/* Summary card */}
              <div className="p-5 bg-[#F0F4F8] dark:bg-[#0A122A] rounded-2xl border border-[#D0DCE8] dark:border-[#1A2A4A] space-y-3">
                <div className="flex justify-between text-xs font-bold text-[#5A6E8A]">
                  <span>Patient</span>
                  <span className="text-[#1A2A4A] dark:text-white">{selectedInvoice.patient?.user?.name}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-[#5A6E8A]">
                  <span>Invoice Total</span>
                  <span className="text-[#1A2A4A] dark:text-white">ETB {Number(selectedInvoice.totalAmount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-[#5A6E8A]">
                  <span>Already Paid</span>
                  <span className="text-[#10B981]">ETB {Number(selectedInvoice.paidAmount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-black border-t border-[#D0DCE8] dark:border-[#1A2A4A] pt-2 mt-2">
                  <span className="text-[#D94A5A]">Balance Due</span>
                  <span className="text-[#D94A5A]">
                    ETB {(Number(selectedInvoice.totalAmount) - Number(selectedInvoice.paidAmount)).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#5A6E8A] uppercase tracking-widest">Amount to Pay (ETB)</label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  max={(Number(selectedInvoice.totalAmount) - Number(selectedInvoice.paidAmount)).toFixed(2)}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full p-4 bg-[#F0F4F8] dark:bg-[#0A122A] rounded-2xl border border-transparent focus:border-[#1E4A8A] outline-none font-bold text-[#1A2A4A] dark:text-white"
                  placeholder="0.00"
                />
              </div>

              {/* Method Select */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#5A6E8A] uppercase tracking-widest">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e: any) => setPaymentMethod(e.target.value)}
                  className="w-full p-4 bg-[#F0F4F8] dark:bg-[#0A122A] rounded-2xl border border-transparent focus:border-[#1E4A8A] outline-none font-bold text-[#1A2A4A] dark:text-white"
                >
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card</option>
                  <option value="CHAPA">Chapa</option>
                  <option value="INSURANCE">Insurance</option>
                </select>
              </div>

              {/* Reference */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#5A6E8A] uppercase tracking-widest">Reference (Optional)</label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="w-full p-4 bg-[#F0F4F8] dark:bg-[#0A122A] rounded-2xl border border-transparent focus:border-[#1E4A8A] outline-none font-bold text-[#1A2A4A] dark:text-white"
                  placeholder="e.g. TXN-98273"
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#5A6E8A] uppercase tracking-widest">Notes (Optional)</label>
                <textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full p-4 bg-[#F0F4F8] dark:bg-[#0A122A] rounded-2xl border border-transparent focus:border-[#1E4A8A] outline-none font-bold text-[#1A2A4A] dark:text-white resize-none"
                  placeholder="Add any billing notes..."
                  rows={2}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submittingPayment}
                className="w-full py-4 bg-[#1E4A8A] text-white rounded-2xl font-black uppercase tracking-widest hover:bg-[#0F3A6A] transition-all flex justify-center items-center gap-2"
              >
                {submittingPayment ? <Loader2 className="animate-spin" size={18} /> : "Submit Payment"}
              </button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
