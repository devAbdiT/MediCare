// components/admin/AddUserButton.tsx
"use client";

import React, { useState } from "react";
import { UserPlus, Plus } from "lucide-react";
import AddUserModal from "./AddUserModal";

interface AddUserButtonProps {
  role: "PATIENT" | "DOCTOR" | "RECEPTIONIST";
  label: string;
  colorClass: string;
}

export default function AddUserButton({ role, label, colorClass }: AddUserButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-3 px-8 py-4 ${colorClass} text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-blue-500/10`}
      >
        <UserPlus size={18} />
        {label}
        <Plus size={14} className="ml-1 opacity-60" />
      </button>

      <AddUserModal 
        role={role} 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
      />
    </>
  );
}
