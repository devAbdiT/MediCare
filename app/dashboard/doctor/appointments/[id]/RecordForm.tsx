// app/dashboard/doctor/appointments/[id]/RecordForm.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileText, Pill, Loader2, Save } from "lucide-react";

interface RecordFormProps {
  appointmentId: string;
  patientId: string;
  doctorId: string;
}

export default function RecordForm({ appointmentId, patientId, doctorId }: RecordFormProps) {
  const router = useRouter();
  const [diagnosis, setDiagnosis] = useState("");
  const [prescription, setPrescription] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/medical-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId,
          patientId,
          doctorId,
          diagnosis,
          prescription,
          notes,
        }),
      });

      if (res.ok) {
        toast.success("Medical record saved and appointment completed!");
        router.push("/dashboard/doctor");
      } else {
        const error = await res.json();
        toast.error(error.message || "Failed to save record");
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
      <div className="space-y-4">
        <label className="flex items-center gap-2 text-sm font-black text-slate-800 uppercase tracking-widest">
          <FileText size={18} className="text-blue-600" />
          Diagnosis
        </label>
        <textarea
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
          placeholder="Enter clinical diagnosis..."
          className="w-full p-6 bg-slate-50 border-2 border-transparent rounded-3xl focus:bg-white focus:border-blue-600 outline-none transition-all font-medium text-slate-900 min-h-[120px] resize-none"
          required
        />
      </div>

      <div className="space-y-4">
        <label className="flex items-center gap-2 text-sm font-black text-slate-800 uppercase tracking-widest">
          <Pill size={18} className="text-emerald-500" />
          Prescription & Treatment
        </label>
        <textarea
          value={prescription}
          onChange={(e) => setPrescription(e.target.value)}
          placeholder="List medications and dosages..."
          className="w-full p-6 bg-slate-50 border-2 border-transparent rounded-3xl focus:bg-white focus:border-emerald-500 outline-none transition-all font-medium text-slate-900 min-h-[150px] resize-none"
          required
        />
      </div>

      <div className="space-y-4">
        <label className="text-sm font-black text-slate-800 uppercase tracking-widest">Internal Notes (Optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Private notes for medical staff..."
          className="w-full p-6 bg-slate-50 border-2 border-transparent rounded-3xl focus:bg-white focus:border-slate-400 outline-none transition-all font-medium text-slate-900 min-h-[100px] resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-6 bg-blue-600 text-white rounded-3xl font-black text-xl shadow-2xl shadow-blue-100 hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
      >
        {loading ? <Loader2 className="animate-spin" /> : <Save />}
        Complete Appointment
      </button>
    </form>
  );
}
