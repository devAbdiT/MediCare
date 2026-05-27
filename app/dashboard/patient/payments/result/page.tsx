"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import PaymentReceipt from "@/components/PaymentReceipt";

function PaymentResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tx_ref = searchParams.get("tx_ref");
  const errorParam = searchParams.get("error");

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"success" | "failed" | null>(null);
  const [receiptData, setReceiptData] = useState<{payment: any, appointment: any} | null>(null);

  useEffect(() => {
    if (errorParam) {
      setLoading(false);
      setStatus("failed");
      toast.error(`Payment Error: ${errorParam.replace(/_/g, " ")}`);
      return;
    }

    if (!tx_ref) {
      setLoading(false);
      setStatus("failed");
      return;
    }

    const verifyPayment = async () => {
      try {
        const res = await fetch(`/api/payments/chapa/verify?tx_ref=${tx_ref}`);
        const data = await res.json();
        
        if (data.status === "success" && data.paymentStatus === "PAID") {
          setStatus("success");
          toast.success("Payment verified successfully!");
          
          // Fetch receipt data
          const receiptRes = await fetch(`/api/payments/receipt?tx_ref=${tx_ref}`);
          if (receiptRes.ok) {
            const rData = await receiptRes.json();
            setReceiptData(rData);
          }
        } else {
          setStatus("failed");
          toast.error("Payment could not be verified or was abandoned.");
        }
      } catch (err) {
        console.error("Verification error:", err);
        setStatus("failed");
        toast.error("Failed to communicate with verification server.");
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [tx_ref, errorParam]);

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <Card className="rounded-[2.5rem] border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden bg-white dark:bg-[#0F172A]">
        <CardContent className="p-12 flex flex-col items-center justify-center text-center">
          {loading ? (
            <div className="space-y-6 flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center animate-pulse">
                <RefreshCw className="w-10 h-10 text-blue-600 dark:text-blue-400 animate-spin" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">Verifying your payment...</h2>
                <p className="text-slate-500 dark:text-slate-400">Please wait while we confirm your transaction with Chapa. Do not close this page.</p>
              </div>
            </div>
          ) : status === "success" ? (
            <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 w-full">
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100">Payment Successful!</h2>
                <p className="text-slate-500 dark:text-slate-400 text-lg mt-2">Your appointment booking is now confirmed.</p>
              </div>

              {receiptData && (
                <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
                  <PaymentReceipt payment={receiptData.payment} appointment={receiptData.appointment} />
                </div>
              )}

              <div className="flex justify-center pt-8">
                <Link href="/dashboard/patient">
                  <Button className="h-12 px-12 rounded-xl font-bold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white transition-all shadow-xl">
                    Back to My Appointments
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-6 flex flex-col items-center animate-in fade-in zoom-in-95 duration-500">
              <div className="w-24 h-24 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <XCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100">Payment Unsuccessful</h2>
                <p className="text-slate-500 dark:text-slate-400 text-lg">We couldn't verify your payment. Your appointment is not confirmed.</p>
              </div>
              <div className="flex gap-4 pt-4 w-full">
                <Link href="/dashboard/patient" className="flex-1">
                  <Button variant="outline" className="w-full h-12 rounded-xl font-bold">Back to Dashboard</Button>
                </Link>
                <Button 
                  onClick={() => window.location.reload()}
                  className="flex-1 h-12 rounded-xl font-bold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white"
                >
                  <RefreshCw className="mr-2 w-4 h-4" /> Retry Verification
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentResultPage() {
  return (
    <DashboardLayout role="patient">
      <Suspense fallback={
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      }>
        <PaymentResultContent />
      </Suspense>
    </DashboardLayout>
  );
}
