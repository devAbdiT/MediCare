// app/dashboard/doctor/profile/DoctorAvailabilityForm.tsx
"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Clock, Calendar, Save, Loader2, CheckCircle2, Zap, AlertCircle } from "lucide-react";

interface AvailabilityItem {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

const DAYS_OF_WEEK = [
  { index: 1, name: "Monday", short: "Mon" },
  { index: 2, name: "Tuesday", short: "Tue" },
  { index: 3, name: "Wednesday", short: "Wed" },
  { index: 4, name: "Thursday", short: "Thu" },
  { index: 5, name: "Friday", short: "Fri" },
  { index: 6, name: "Saturday", short: "Sat" },
  { index: 0, name: "Sunday", short: "Sun" },
];

const TIME_OPTIONS = [
  "06:00", "06:30", "07:00", "07:30", "08:00", "08:30", "09:00", "09:30",
  "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
  "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00"
];

export default function DoctorAvailabilityForm({ doctorId }: { doctorId: string }) {
  const [schedule, setSchedule] = useState<AvailabilityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Initialize schedule for 7 days
  useEffect(() => {
    async function loadAvailability() {
      setLoading(true);
      try {
        const res = await fetch(`/api/doctors/${doctorId}/availability`);
        if (res.ok) {
          const data: AvailabilityItem[] = await res.json();
          // Ensure all 7 days (0..6) are present
          const fullSchedule = DAYS_OF_WEEK.map((day) => {
            const existing = data.find((d) => d.dayOfWeek === day.index);
            return (
              existing || {
                dayOfWeek: day.index,
                startTime: "09:00",
                endTime: "17:00",
                isActive: day.index >= 1 && day.index <= 5,
              }
            );
          });
          setSchedule(fullSchedule);
        } else {
          toast.error("Failed to load working hours");
        }
      } catch (err) {
        console.error(err);
        toast.error("Error connecting to server");
      } finally {
        setLoading(false);
      }
    }

    if (doctorId) {
      loadAvailability();
    }
  }, [doctorId]);

  const handleToggleActive = (dayOfWeek: number) => {
    setSchedule((prev) =>
      prev.map((item) =>
        item.dayOfWeek === dayOfWeek ? { ...item, isActive: !item.isActive } : item
      )
    );
  };

  const handleTimeChange = (
    dayOfWeek: number,
    field: "startTime" | "endTime",
    value: string
  ) => {
    setSchedule((prev) =>
      prev.map((item) =>
        item.dayOfWeek === dayOfWeek ? { ...item, [field]: value } : item
      )
    );
  };

  const applyPreset = (type: "standard" | "morning" | "fullweek") => {
    setSchedule((prev) =>
      prev.map((item) => {
        if (type === "standard") {
          const isWeekday = item.dayOfWeek >= 1 && item.dayOfWeek <= 5;
          return {
            ...item,
            startTime: "09:00",
            endTime: "17:00",
            isActive: isWeekday,
          };
        } else if (type === "morning") {
          const isWeekday = item.dayOfWeek >= 1 && item.dayOfWeek <= 5;
          return {
            ...item,
            startTime: "08:00",
            endTime: "13:00",
            isActive: isWeekday,
          };
        } else {
          return {
            ...item,
            startTime: "08:00",
            endTime: "17:00",
            isActive: true,
          };
        }
      })
    );
    toast.info("Preset applied. Remember to save changes!");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate that active days have endTime > startTime
    for (const item of schedule) {
      if (item.isActive && item.startTime >= item.endTime) {
        const dayObj = DAYS_OF_WEEK.find((d) => d.index === item.dayOfWeek);
        toast.error(`Invalid hours on ${dayObj?.name}: End time must be after start time.`);
        return;
      }
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/doctors/${doctorId}/availability`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schedule }),
      });

      if (res.ok) {
        const updatedData = await res.json();
        setSchedule(updatedData);
        toast.success("Working hours and availability schedule saved successfully!");
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Failed to save availability schedule");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 bg-white dark:bg-[#111C3A] rounded-[2.5rem] border border-[#D0DCE8] dark:border-[#1A2A4A] text-[#5A6E8A]">
        <Loader2 size={24} className="animate-spin mr-3 text-[#1E4A8A] dark:text-[#4A8AC8]" />
        <span className="font-bold text-sm">Loading availability schedule...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-8">
      {/* Header & Presets */}
      <div className="bg-white dark:bg-[#111C3A] p-8 rounded-[2.5rem] border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-black text-[#1A2A4A] dark:text-[#E8EEF8] flex items-center gap-3">
              <Calendar size={22} className="text-[#1E4A8A] dark:text-[#4A8AC8]" />
              Weekly Working Hours & Days
            </h2>
            <p className="text-xs text-[#5A6E8A] dark:text-[#8A9CBA] font-medium mt-1">
              Specify your availability for patient appointments each day of the week.
            </p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3.5 bg-[#1E4A8A] dark:bg-[#4A8AC8] hover:bg-[#1A3F75] dark:hover:bg-[#3B72A8] text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg transition-all flex items-center gap-2.5 disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save Schedule
          </button>
        </div>

        {/* Quick Presets */}
        <div className="pt-4 border-t border-[#D0DCE8] dark:border-[#1A2A4A] flex flex-wrap items-center gap-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#5A6E8A] dark:text-[#8A9CBA] flex items-center gap-1.5 mr-2">
            <Zap size={14} className="text-amber-500" />
            Quick Presets:
          </span>
          <button
            type="button"
            onClick={() => applyPreset("standard")}
            className="px-4 py-2 bg-[#F0F4F8] dark:bg-[#0A122A] hover:bg-[#1E4A8A]/10 text-[#1E4A8A] dark:text-[#4A8AC8] rounded-xl text-xs font-bold transition-colors"
          >
            Mon-Fri (9:00 AM - 5:00 PM)
          </button>
          <button
            type="button"
            onClick={() => applyPreset("morning")}
            className="px-4 py-2 bg-[#F0F4F8] dark:bg-[#0A122A] hover:bg-[#1E4A8A]/10 text-[#1E4A8A] dark:text-[#4A8AC8] rounded-xl text-xs font-bold transition-colors"
          >
            Mon-Fri Mornings (8:00 AM - 1:00 PM)
          </button>
          <button
            type="button"
            onClick={() => applyPreset("fullweek")}
            className="px-4 py-2 bg-[#F0F4F8] dark:bg-[#0A122A] hover:bg-[#1E4A8A]/10 text-[#1E4A8A] dark:text-[#4A8AC8] rounded-xl text-xs font-bold transition-colors"
          >
            Full 7-Day Availability
          </button>
        </div>
      </div>

      {/* Days Grid */}
      <div className="space-y-4">
        {DAYS_OF_WEEK.map((day) => {
          const item = schedule.find((s) => s.dayOfWeek === day.index) || {
            dayOfWeek: day.index,
            startTime: "09:00",
            endTime: "17:00",
            isActive: false,
          };

          return (
            <div
              key={day.index}
              className={`p-6 rounded-[2rem] border transition-all duration-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                item.isActive
                  ? "bg-white dark:bg-[#111C3A] border-[#D0DCE8] dark:border-[#1A2A4A] shadow-sm"
                  : "bg-gray-50/50 dark:bg-white/5 border-transparent opacity-60"
              }`}
            >
              {/* Day Toggle */}
              <div className="flex items-center gap-4 min-w-[200px]">
                <button
                  type="button"
                  onClick={() => handleToggleActive(day.index)}
                  className={`w-12 h-6 rounded-full transition-colors relative flex items-center p-1 ${
                    item.isActive ? "bg-[#1E4A8A] dark:bg-[#4A8AC8]" : "bg-gray-300 dark:bg-gray-700"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      item.isActive ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>

                <div>
                  <h3 className="font-black text-[#1A2A4A] dark:text-[#E8EEF8] text-base">
                    {day.name}
                  </h3>
                  <span
                    className={`text-[10px] font-black uppercase tracking-wider ${
                      item.isActive
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-[#5A6E8A] dark:text-[#8A9CBA]"
                    }`}
                  >
                    {item.isActive ? "Available" : "Not Available"}
                  </span>
                </div>
              </div>

              {/* Time Pickers */}
              {item.isActive ? (
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="flex items-center gap-2 bg-[#F0F4F8] dark:bg-[#0A122A] px-4 py-2.5 rounded-2xl border border-[#D0DCE8] dark:border-[#1A2A4A]">
                    <Clock size={16} className="text-[#5A6E8A] shrink-0" />
                    <span className="text-xs font-bold text-[#5A6E8A] dark:text-[#8A9CBA]">From:</span>
                    <select
                      value={item.startTime}
                      onChange={(e) => handleTimeChange(day.index, "startTime", e.target.value)}
                      className="bg-transparent font-bold text-sm text-[#1A2A4A] dark:text-[#E8EEF8] outline-none cursor-pointer"
                    >
                      {TIME_OPTIONS.map((t) => (
                        <option key={t} value={t} className="bg-white dark:bg-[#111C3A]">
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <span className="text-xs font-bold text-[#5A6E8A] dark:text-[#8A9CBA]">—</span>

                  <div className="flex items-center gap-2 bg-[#F0F4F8] dark:bg-[#0A122A] px-4 py-2.5 rounded-2xl border border-[#D0DCE8] dark:border-[#1A2A4A]">
                    <Clock size={16} className="text-[#5A6E8A] shrink-0" />
                    <span className="text-xs font-bold text-[#5A6E8A] dark:text-[#8A9CBA]">To:</span>
                    <select
                      value={item.endTime}
                      onChange={(e) => handleTimeChange(day.index, "endTime", e.target.value)}
                      className="bg-transparent font-bold text-sm text-[#1A2A4A] dark:text-[#E8EEF8] outline-none cursor-pointer"
                    >
                      {TIME_OPTIONS.map((t) => (
                        <option key={t} value={t} className="bg-white dark:bg-[#111C3A]">
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="text-xs font-medium text-[#5A6E8A] dark:text-[#8A9CBA] italic">
                  Day Off / No appointments scheduled
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Save Action Footer */}
      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={saving}
          className="px-10 py-4 bg-[#1E4A8A] dark:bg-[#4A8AC8] hover:bg-[#1A3F75] dark:hover:bg-[#3B72A8] text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl transition-all flex items-center gap-3 disabled:opacity-50"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
          Save Working Hours
        </button>
      </div>
    </form>
  );
}
