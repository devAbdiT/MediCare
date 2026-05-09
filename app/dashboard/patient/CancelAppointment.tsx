// app/dashboard/patient/CancelAppointment.tsx
"use client";

import React, { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function CancelAppointment({ appointmentId }: { appointmentId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this appointment?")) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/appointments/${appointmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });

      if (res.ok) {
        toast.success("Appointment cancelled");
        router.refresh();
      } else {
        toast.error("Failed to cancel appointment");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleCancel}
      disabled={loading}
      className="p-4 bg-red-50 dark:bg-red-900/10 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl transition-all shadow-sm flex items-center justify-center disabled:opacity-50"
      title="Cancel Appointment"
    >
      {loading ? <Loader2 className="animate-spin" size={20} /> : <X size={20} />}
    </button>
  );
}
