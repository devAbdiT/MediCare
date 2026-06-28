"use client";

import { useState } from "react";
import WalkInModal from "@/components/receptionist/WalkInModal";
import { UserRound } from "lucide-react";

export function WalkInButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        id="walk-in-patient-btn"
        onClick={() => setOpen(true)}
        className="flex-1 lg:flex-none w-full lg:w-auto bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white px-10 py-5 rounded-[1.5rem] font-black shadow-2xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-3 text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-95"
      >
        <UserRound size={20} />
        Walk-In Patient
      </button>

      <WalkInModal
        open={open}
        onClose={() => setOpen(false)}
        onSuccess={() => {
          // Refresh the page to update the manifest list
          window.location.reload();
        }}
      />
    </>
  );
}
