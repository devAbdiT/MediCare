"use client";

import React from "react";
import { Printer } from "lucide-react";
import { printPrescription } from "./RecordForm";

interface PrintHistoryButtonProps {
  record: any;
  patient: any;
  doctorName: string;
}

export function PrintHistoryButton({ record, patient, doctorName }: PrintHistoryButtonProps) {
  return (
    <button 
      onClick={() => printPrescription(record, patient, doctorName)}
      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors tooltip-trigger"
      title="Print Prescription"
    >
      <Printer size={16} />
    </button>
  );
}
