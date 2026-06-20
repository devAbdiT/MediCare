"use client";

import React, { useState, useEffect } from "react";
import { FileText, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface LabResultFormProps {
  labOrderId: string;
  testCatalogue?: {
    unit: string | null;
    referenceRange: string | null;
  } | null;
  onSuccess: () => void;
}

export default function LabResultForm({ labOrderId, testCatalogue, onSuccess }: LabResultFormProps) {
  const [resultValue, setResultValue] = useState("");
  const [unit, setUnit] = useState(testCatalogue?.unit || "");
  const [referenceRange, setReferenceRange] = useState(testCatalogue?.referenceRange || "");
  const [isAbnormal, setIsAbnormal] = useState(false);
  const [interpretation, setInterpretation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [manuallyToggled, setManuallyToggled] = useState(false);

  // Auto-check if numeric result is outside range
  useEffect(() => {
    if (manuallyToggled) return; // Don't override if user manually changed it
    if (!resultValue || !referenceRange) {
      setIsAbnormal(false);
      return;
    }
    
    const val = parseFloat(resultValue);
    if (isNaN(val)) return; // Not numeric, can't auto-check
    
    // Simple parser for range e.g., "12.0 - 16.0" or "4.5-11.0"
    const match = referenceRange.match(/([0-9.]+)\s*[-–]\s*([0-9.]+)/);
    if (match) {
      const min = parseFloat(match[1]);
      const max = parseFloat(match[2]);
      if (!isNaN(min) && !isNaN(max)) {
        setIsAbnormal(val < min || val > max);
      }
    }
  }, [resultValue, referenceRange, manuallyToggled]);

  const submitResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resultValue.trim()) {
      toast.error("Result value is required");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/lab/results`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          labOrderId,
          resultValue: resultValue.trim(),
          unit: unit.trim() || null,
          referenceRange: referenceRange.trim() || null,
          isAbnormal,
          interpretation: interpretation.trim() || null,
        }),
      });
      
      if (res.ok) {
        toast.success("Result submitted successfully");
        onSuccess();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to submit result");
      }
    } catch {
      toast.error("Unexpected error submitting result");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#0D1F1E] rounded-2xl border border-teal-200 dark:border-teal-800 p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
          <FileText size={17} className="text-teal-600 dark:text-teal-400" />
        </div>
        <div>
          <p className="font-black text-[#1A2A4A] dark:text-[#E8EEF8] text-sm">Enter Lab Result</p>
          <p className="text-[11px] text-[#5A6E8A] dark:text-[#8A9CBA]">
            Submitting will automatically mark order as RESULTED
          </p>
        </div>
      </div>

      <form onSubmit={submitResult} className="space-y-4">
        <div>
          <label className="block text-xs font-black text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-wider mb-1.5">
            Result Value <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={resultValue}
            onChange={(e) => setResultValue(e.target.value)}
            placeholder="e.g. 7.2, POSITIVE, 140/90"
            className="w-full px-4 py-3 rounded-xl bg-[#F0F4F8] dark:bg-[#081614] border border-[#CCECE9] dark:border-[#0F3330] text-sm font-medium text-[#1A2A4A] dark:text-[#E8EEF8] placeholder:text-[#5A6E8A]/60 outline-none focus:ring-2 focus:ring-teal-500/30 transition-all"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-black text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-wider mb-1.5">
              Unit
            </label>
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="mg/dL, mmol/L..."
              className="w-full px-4 py-3 rounded-xl bg-[#F0F4F8] dark:bg-[#081614] border border-[#CCECE9] dark:border-[#0F3330] text-sm font-medium text-[#1A2A4A] dark:text-[#E8EEF8] placeholder:text-[#5A6E8A]/60 outline-none focus:ring-2 focus:ring-teal-500/30 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-wider mb-1.5">
              Reference Range
            </label>
            <input
              type="text"
              value={referenceRange}
              onChange={(e) => setReferenceRange(e.target.value)}
              placeholder="4.5–11.0"
              className="w-full px-4 py-3 rounded-xl bg-[#F0F4F8] dark:bg-[#081614] border border-[#CCECE9] dark:border-[#0F3330] text-sm font-medium text-[#1A2A4A] dark:text-[#E8EEF8] placeholder:text-[#5A6E8A]/60 outline-none focus:ring-2 focus:ring-teal-500/30 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setIsAbnormal(!isAbnormal);
              setManuallyToggled(true);
            }}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
              isAbnormal ? "bg-red-500" : "bg-[#D0DCE8] dark:bg-[#1A2A4A]"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transform transition-transform duration-200 ${
                isAbnormal ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
          <span className={`text-sm font-bold ${isAbnormal ? "text-red-600 dark:text-red-400" : "text-[#5A6E8A] dark:text-[#8A9CBA]"}`}>
            {isAbnormal ? "⚠ Abnormal Result" : "Normal Result"}
          </span>
        </div>

        <div>
          <label className="block text-xs font-black text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-wider mb-1.5">
            Interpretation / Comment
            <span className="font-normal normal-case text-[#8A9CBA] ml-1">(optional)</span>
          </label>
          <textarea
            rows={2}
            value={interpretation}
            onChange={(e) => setInterpretation(e.target.value)}
            placeholder="Clinical interpretation, comments..."
            className="w-full px-4 py-3 rounded-xl bg-[#F0F4F8] dark:bg-[#081614] border border-[#CCECE9] dark:border-[#0F3330] text-sm font-medium text-[#1A2A4A] dark:text-[#E8EEF8] placeholder:text-[#5A6E8A]/60 outline-none focus:ring-2 focus:ring-teal-500/30 transition-all resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={submitting || !resultValue.trim()}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white rounded-2xl font-bold text-sm transition-all duration-200 active:scale-[0.98] shadow-md shadow-teal-600/20"
        >
          {submitting ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <CheckCircle2 size={18} />
          )}
          Submit Result & Complete Order
        </button>
      </form>
    </div>
  );
}
