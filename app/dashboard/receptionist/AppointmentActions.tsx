// app/dashboard/receptionist/AppointmentActions.tsx
"use client";

import React, { useState } from "react";
import { X, Loader2, Calendar } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function AppointmentActions({ appointmentId }: { appointmentId: string }) {
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
        toast.error("Failed to cancel");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button 
        onClick={handleCancel}
        disabled={loading}
        className="p-3 bg-red-50 dark:bg-red-900/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all disabled:opacity-50"
        title="Cancel"
      >
        {loading ? <Loader2 className="animate-spin" size={18} /> : <X size={18} />}
      </button>
      <button 
        className="p-3 bg-blue-50 dark:bg-blue-900/10 text-blue-500 hover:bg-blue-500 hover:text-white rounded-xl transition-all"
        title="Reschedule"
        onClick={() => toast.info("Rescheduling feature coming soon in detailed view.")}
      >
        <Calendar size={18} />
      </button>
    </div>
  );
}
