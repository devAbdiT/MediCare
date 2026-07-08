"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Mail,
  ShieldCheck,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [countdown, setCountdown] = useState(0);

  // Countdown before allowing resend
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleResend = async () => {
    setStatus("sending");
    try {
      const res = await fetch("/api/auth/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus("sent");
        setCountdown(60); // throttle: 60 s before next resend
      } else {
        const body = await res.json().catch(() => ({}));
        console.error("Resend failed:", body);
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A122A] via-[#111C3A] to-[#1E3A5F] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl text-center space-y-8">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-gradient-to-br from-[#1E4A8A] to-[#4A8AC8] rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/30">
              <Mail size={40} className="text-white" />
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-3">
            <h1 className="text-3xl font-black text-white tracking-tight">
              Verify Your Email
            </h1>
            <p className="text-[#8A9CBA] font-medium leading-relaxed">
              Please verify your email to access your dashboard.
            </p>
            {email && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#1E4A8A]/30 border border-[#1E4A8A]/50 rounded-2xl">
                <Mail size={14} className="text-[#4A8AC8]" />
                <span className="text-sm font-bold text-[#4A8AC8] break-all">
                  {decodeURIComponent(email)}
                </span>
              </div>
            )}
            <p className="text-sm text-[#5A6E8A] font-medium">
              We sent a verification link to the email address above.
              <br />
              Check your inbox (and spam folder).
            </p>
          </div>

          {/* Status feedback */}
          {status === "sent" && (
            <div className="flex items-center gap-3 px-5 py-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400">
              <CheckCircle2 size={20} className="shrink-0" />
              <p className="text-sm font-bold text-left">
                Email sent! Check your inbox.
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="px-5 py-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-sm font-bold">
              Failed to send. Please try again.
            </div>
          )}

          {/* Resend button */}
          <button
            id="resend-verification-btn"
            onClick={handleResend}
            disabled={status === "sending" || countdown > 0}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#1E4A8A] to-[#4A8AC8] hover:from-[#1A3F75] hover:to-[#3B72A8] text-white font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {status === "sending" ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Sending…
              </>
            ) : countdown > 0 ? (
              <>
                <RefreshCw size={18} />
                Resend in {countdown}s
              </>
            ) : (
              <>
                <RefreshCw size={18} />
                Resend Verification Email
              </>
            )}
          </button>

          {/* What to do next hint */}
          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-left space-y-2">
            <div className="flex items-center gap-2 text-[#8A9CBA] text-xs font-black uppercase tracking-widest mb-2">
              <ShieldCheck size={14} />
              After verifying
            </div>
            <p className="text-sm text-[#5A6E8A] font-medium">
              Click the link in the email, then return and log in — you'll be taken directly to your dashboard.
            </p>
          </div>

          {/* Back to login */}
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-bold text-[#5A6E8A] hover:text-[#8A9CBA] transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Login
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-[#2A3A5A] mt-6 font-medium">
          MediCare — Secure Patient Management System
        </p>
      </div>
    </div>
  );
}
