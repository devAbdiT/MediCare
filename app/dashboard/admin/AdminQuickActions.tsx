// app/dashboard/admin/AdminQuickActions.tsx
"use client";

import React, { useState } from "react";
import { UserPlus, Stethoscope, Briefcase, Plus, ShieldAlert } from "lucide-react";
import AddUserModal from "@/components/admin/AddUserModal";

export default function AdminQuickActions() {
  const [modalRole, setModalRole] = useState<"PATIENT" | "DOCTOR" | "RECEPTIONIST" | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-[#1A2A4A] dark:text-[#E8EEF8] tracking-tight flex items-center gap-3">
          Management Controls
        </h2>
        <div className="flex items-center gap-2 px-4 py-1.5 bg-[#F0F4F8] dark:bg-[#0A122A] rounded-full border border-[#D0DCE8] dark:border-[#1A2A4A]">
          <ShieldAlert size={14} className="text-[#1E4A8A] dark:text-[#4A8AC8]" />
          <span className="text-[10px] font-black uppercase tracking-widest text-[#5A6E8A] dark:text-[#8A9CBA]">Admin Access Validated</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        <ActionButton 
          icon={<UserPlus />} 
          label="Add Patient" 
          description="Register patient"
          color="bg-[#2D8A6E]" 
          onClick={() => setModalRole("PATIENT")} 
        />
        <ActionButton 
          icon={<Stethoscope />} 
          label="Add Doctor" 
          description="Onboard specialist"
          color="bg-[#1E4A8A]" 
          onClick={() => setModalRole("DOCTOR")} 
        />
        <ActionButton 
          icon={<Briefcase />} 
          label="Add Staff" 
          description="Create receptionist"
          color="bg-[#3A7BC8]" 
          onClick={() => setModalRole("RECEPTIONIST")} 
        />
        <ActionButton 
          icon={<Briefcase />} 
          label="Add Pharmacist" 
          description="Create pharmacist"
          color="bg-emerald-600" 
          onClick={() => setModalRole("PHARMACIST" as any)} 
        />
        <ActionButton 
          icon={<Briefcase />} 
          label="Add Lab Tech" 
          description="Create lab tech"
          color="bg-teal-600" 
          onClick={() => setModalRole("LABTECH" as any)} 
        />
      </div>

      {modalRole && (
        <AddUserModal 
          role={modalRole} 
          isOpen={!!modalRole} 
          onClose={() => setModalRole(null)} 
        />
      )}
    </div>
  );
}

function ActionButton({ icon, label, description, color, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className="group relative bg-white dark:bg-[#111C3A] p-8 rounded-[2.5rem] border border-[#D0DCE8] dark:border-[#1A2A4A] text-left hover:border-[#1E4A8A] dark:hover:border-[#4A8AC8] transition-all duration-500 shadow-sm overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 dark:bg-[#0A122A] rounded-bl-[5rem] -mr-10 -mt-10 group-hover:scale-110 transition-transform duration-700" />
      <div className={`w-14 h-14 ${color} text-white rounded-2xl flex items-center justify-center mb-6 relative z-10 shadow-lg group-hover:scale-110 transition-transform duration-500`}>
        {React.cloneElement(icon as React.ReactElement, { size: 28 } as any)}
      </div>
      <div className="relative z-10">
        <h4 className="text-xl font-black text-[#1A2A4A] dark:text-[#E8EEF8] mb-1">{label}</h4>
        <p className="text-xs font-bold text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-widest opacity-60">{description}</p>
      </div>
      <div className="absolute bottom-8 right-8 w-10 h-10 bg-slate-100 dark:bg-[#0A122A] rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-[#1E4A8A] group-hover:text-white transition-all">
        <Plus size={20} />
      </div>
    </button>
  );
}
