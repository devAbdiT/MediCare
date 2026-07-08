"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, Loader2 } from "lucide-react";

interface VerifyEmailButtonProps {
  userId: string;
}

export function VerifyEmailButton({ userId }: VerifyEmailButtonProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const router = useRouter();

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/verify-email`, {
        method: "PATCH",
      });

      if (!res.ok) {
        throw new Error("Failed to verify email");
      }

      toast.success("User email manually verified!");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while verifying the email.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <button
      onClick={handleVerify}
      disabled={isVerifying}
      className="flex items-center gap-2 px-6 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
      title="Mark user email as verified"
    >
      {isVerifying ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
      Mark Email Verified
    </button>
  );
}
