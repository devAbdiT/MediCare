"use client";

import React, { useRef } from "react";
import { format } from "date-fns";
import { Printer, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReactToPrint } from "react-to-print";

interface PaymentReceiptProps {
  payment: any;
  appointment: any;
}

export default function PaymentReceipt({ payment, appointment }: PaymentReceiptProps) {
  const componentRef = useRef<HTMLDivElement>(null);
  
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Receipt_${payment.txRef}`,
  });

  if (!payment || !appointment) return null;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="w-full flex justify-end print:hidden">
        <Button onClick={() => handlePrint()} className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xl">
          <Printer className="w-4 h-4 mr-2" />
          Print Receipt
        </Button>
      </div>

      <div 
        ref={componentRef}
        className="w-full max-w-2xl bg-white text-slate-900 p-12 rounded-[2rem] border border-slate-200 shadow-sm print:shadow-none print:border-none print:p-0 relative overflow-hidden"
      >
        {/* Receipt Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 text-blue-600 rounded-full mb-4">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black tracking-tight uppercase text-slate-900">MediCare Appointment Scheduling System</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest mt-2">Appointment Payment Receipt</p>
        </div>

        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Transaction Ref</p>
              <p className="font-mono font-bold">{payment.txRef}</p>
            </div>
            {payment.chapaRefId && (
              <div className="space-y-1 text-right">
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Chapa Ref</p>
                <p className="font-mono font-bold">{payment.chapaRefId}</p>
              </div>
            )}
          </div>

          <div className="border-t border-b border-slate-100 py-6 grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Patient Details</p>
                <p className="font-bold text-base mt-1">{appointment.patientName}</p>
                <p className="font-mono text-xs text-slate-500">{appointment.cardNumber}</p>
              </div>
              <div>
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Appointment Type</p>
                <p className="font-bold text-sm mt-1 capitalize">{appointment.appointmentType?.replace('_', ' ')}</p>
                <p className="text-xs text-slate-500 font-bold uppercase">{appointment.priority}</p>
              </div>
            </div>
            
            <div className="space-y-4 text-right">
              <div>
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Attending Doctor</p>
                <p className="font-bold text-base mt-1">{appointment.doctorName}</p>
              </div>
              <div>
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Date & Time</p>
                <p className="font-bold text-sm mt-1">{format(new Date(appointment.dateTime), "MMM dd, yyyy")}</p>
                <p className="text-xs text-slate-500 font-bold uppercase">{format(new Date(appointment.dateTime), "h:mm a")}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-6 rounded-2xl flex justify-between items-center">
            <div>
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Payment Status</p>
              <p className="text-emerald-600 font-black text-lg uppercase tracking-wider">{payment.status}</p>
              {payment.paidAt && <p className="text-xs text-slate-400 font-bold">{format(new Date(payment.paidAt), "MMM dd, yyyy h:mm a")}</p>}
            </div>
            <div className="text-right">
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Amount</p>
              <p className="text-4xl font-black">{payment.amount} <span className="text-sm text-slate-400">{payment.currency}</span></p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center pt-8 border-t border-slate-100">
          <p className="text-xs text-slate-400 font-bold italic">This is a system-generated appointment payment receipt.</p>
        </div>
        
        {/* Decorative background circle */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-blue-50 rounded-full blur-[80px] opacity-50 pointer-events-none" />
      </div>
    </div>
  );
}
