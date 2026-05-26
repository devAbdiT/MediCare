"use client";

import React, { useState } from "react";
import { Printer } from "lucide-react";
import { AppointmentSlip } from "./AppointmentSlip";

export default function PrintAppointmentButton({ 
  appointment, 
  variant = "outline" 
}: { 
  appointment: any;
  variant?: "outline" | "ghost" | "solid";
}) {
  const [printing, setPrinting] = useState(false);

  const handlePrint = () => {
    setPrinting(true);
    // Give react time to mount the AppointmentSlip before calling print
    setTimeout(() => {
      window.print();
      // Allow the print dialog to open before unmounting
      setTimeout(() => {
        setPrinting(false);
      }, 500);
    }, 100);
  };

  const getVariantClasses = () => {
    switch (variant) {
      case "ghost":
        return "bg-transparent text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20";
      case "solid":
        return "bg-blue-600 text-white hover:bg-blue-700 shadow-sm";
      case "outline":
      default:
        return "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-blue-200 dark:border-blue-800";
    }
  };

  return (
    <>
      <button 
        onClick={handlePrint}
        className={`p-2 rounded-xl transition-all ${getVariantClasses()} print:hidden`}
        title="Print Appointment Slip"
      >
        <Printer size={18} />
      </button>
      
      {printing && <AppointmentSlip appointment={appointment} />}
    </>
  );
}
