"use client";

import React from "react";
import { TriangleAlert, CheckCircle2, User, Clock, FileText } from "lucide-react";

interface LabResultCardProps {
  labOrder: any; 
}

export default function LabResultCard({ labOrder }: LabResultCardProps) {
  const result = labOrder.result;
  if (!result) return null;

  const isAbnormal = result.isAbnormal;

  return (
    <div className={`rounded-2xl border p-6 transition-all ${isAbnormal ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900" : "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900"}`}>
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider text-[#5A6E8A] dark:text-[#8A9CBA] mb-1">
            {labOrder.testName}
          </h3>
          <div className="flex items-baseline gap-2">
            <span className={`text-4xl font-black tracking-tight ${isAbnormal ? "text-red-700 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400"}`}>
              {result.resultValue}
            </span>
            {result.unit && (
              <span className={`text-lg font-bold ${isAbnormal ? "text-red-600/70 dark:text-red-400/70" : "text-emerald-600/70 dark:text-emerald-400/70"}`}>
                {result.unit}
              </span>
            )}
          </div>
          {result.referenceRange && (
            <p className="text-sm font-medium mt-1 text-[#5A6E8A] dark:text-[#8A9CBA]">
              Ref: {result.referenceRange}
            </p>
          )}
        </div>

        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-black uppercase tracking-widest ${isAbnormal ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"}`}>
          {isAbnormal ? <TriangleAlert size={16} /> : <CheckCircle2 size={16} />}
          {isAbnormal ? "ABNORMAL" : "Normal"}
        </div>
      </div>

      {result.interpretation && (
        <div className="mb-5 bg-white/60 dark:bg-[#081614]/40 p-4 rounded-xl border border-black/5 dark:border-white/5">
          <div className="flex items-center gap-2 mb-1.5 text-xs font-black text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-wider">
            <FileText size={14} /> Interpretation
          </div>
          <p className="text-sm font-medium text-[#1A2A4A] dark:text-[#E8EEF8]">
            {result.interpretation}
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-black/5 dark:border-white/5 text-xs font-semibold text-[#5A6E8A] dark:text-[#8A9CBA]">
        <div className="flex items-center gap-1.5">
          <User size={14} />
          <span>Entered by: {result.enteredById.substring(0, 8)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock size={14} />
          <span>{new Date(result.enteredAt).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
