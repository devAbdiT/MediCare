"use client";

import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Slot {
  time: string; // HH:mm
  label: string; // formatted label for UI
  available: boolean;
  reason?: string;
}

type SlotPickerProps = {
  doctorId: string;
  date: string; // YYYY-MM-DD
  selectedTime?: string;
  onSelect: (time: string) => void;
  className?: string;
};

export default function SlotPicker({
  doctorId,
  date,
  selectedTime,
  onSelect,
  className,
}: SlotPickerProps) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!doctorId || !date) return;
    setLoading(true);
    fetch(`/api/doctors/${doctorId}/slots?date=${date}`)
      .then((res) => res.json())
      .then((data) => {
        setSlots(data.slots ?? []);
      })
      .catch(() => {
        setSlots([]);
      })
      .finally(() => setLoading(false));
  }, [doctorId, date]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="animate-spin text-teal-600" size={32} />
      </div>
    );
  }

  if (!slots.length) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        No available slots for this date.
      </p>
    );
  }

  return (
    <div className={cn("grid grid-cols-2 gap-3", className)}>
      {slots.map((slot) => (
        <button
          key={slot.time}
          type="button"
          disabled={!slot.available}
          onClick={() => onSelect(slot.time)}
          className={cn(
            "h-12 rounded-xl border transition-colors flex items-center justify-center",
            slot.available
              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
              : "bg-gray-300 text-gray-600 cursor-not-allowed",
            selectedTime === slot.time && "ring-2 ring-blue-500",
            "dark:bg-emerald-900/20 dark:text-emerald-200 dark:hover:bg-emerald-800",
          )}
        >
          {slot.label}
        </button>
      ))}
    </div>
  );
}
