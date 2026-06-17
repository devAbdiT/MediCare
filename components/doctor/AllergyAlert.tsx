// components/doctor/AllergyAlert.tsx
"use client";

import React from "react";
import { AlertOctagon } from "lucide-react";
import { Allergy } from "@prisma/client";

interface AllergyAlertProps {
  allergies: Allergy[];
}

export default function AllergyAlert({ allergies }: AllergyAlertProps) {
  if (!allergies || allergies.length === 0) {
    return null;
  }

  // Check if there are any severe or life threatening allergies to adjust border style
  const hasSevereOrCritical = allergies.some(
    (a) => a.severity === "SEVERE" || a.severity === "LIFE_THREATENING"
  );

  return (
    <div className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col md:flex-row items-start gap-4 ${
      hasSevereOrCritical
        ? "bg-red-50/50 dark:bg-red-950/10 border-red-500/50 dark:border-red-500/30"
        : "bg-amber-50/40 dark:bg-amber-950/10 border-amber-500/40 dark:border-amber-500/20"
    }`}>
      <div className={`p-3.5 rounded-2xl shrink-0 ${
        hasSevereOrCritical
          ? "bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400"
          : "bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400"
      }`}>
        <AlertOctagon size={24} className={hasSevereOrCritical ? "animate-bounce" : ""} />
      </div>
      
      <div className="space-y-3 w-full">
        <h3 className="text-sm font-black text-[#1A2A4A] dark:text-[#E8EEF8] uppercase tracking-wider">
          ⚠️ Known Patient Allergies — Review Before Prescribing
        </h3>
        
        <div className="flex flex-wrap gap-2.5">
          {allergies.map((allergy) => {
            const reactionText = allergy.reaction ? ` (${allergy.reaction})` : "";
            
            // LIFE_THREATENING: solid red badge with CSS pulse/blink animation
            if (allergy.severity === "LIFE_THREATENING") {
              return (
                <span
                  key={allergy.id}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-red-600 text-white rounded-full text-xs font-black uppercase tracking-wider animate-pulse shadow-md shadow-red-600/30"
                  title="Life Threatening Allergy"
                >
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  {allergy.allergen} • LIFE THREATENING{reactionText}
                </span>
              );
            }
            
            // SEVERE: solid red badge
            if (allergy.severity === "SEVERE") {
              return (
                <span
                  key={allergy.id}
                  className="inline-flex items-center px-4 py-1.5 bg-red-500 text-white rounded-full text-xs font-black uppercase tracking-wider shadow-sm"
                  title="Severe Allergy"
                >
                  {allergy.allergen} • SEVERE{reactionText}
                </span>
              );
            }
            
            // MODERATE: orange/amber badge
            if (allergy.severity === "MODERATE") {
              return (
                <span
                  key={allergy.id}
                  className="inline-flex items-center px-4 py-1.5 bg-amber-500 text-white rounded-full text-xs font-black uppercase tracking-wider"
                  title="Moderate Allergy"
                >
                  {allergy.allergen} • MODERATE{reactionText}
                </span>
              );
            }
            
            // MILD: yellow badge
            return (
              <span
                key={allergy.id}
                className="inline-flex items-center px-4 py-1.5 bg-yellow-400 text-slate-900 rounded-full text-xs font-black uppercase tracking-wider"
                title="Mild Allergy"
              >
                {allergy.allergen} • MILD{reactionText}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
