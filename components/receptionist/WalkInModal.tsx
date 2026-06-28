"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  UserRound,
  Stethoscope,
  Calendar,
  Clock,
  AlertTriangle,
  ClipboardList,
  Loader2,
  Search,
  X,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Round time to nearest 30 minutes
function roundToNearest30(date: Date): string {
  const ms = 1000 * 60 * 30;
  const rounded = new Date(Math.round(date.getTime() / ms) * ms);
  return rounded.toTimeString().slice(0, 5); // "HH:MM"
}

function todayDateString(): string {
  return new Date().toISOString().split("T")[0];
}

interface WalkInModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function WalkInModal({ open, onClose, onSuccess }: WalkInModalProps) {
  // Patient search
  const [patientQuery, setPatientQuery] = useState("");
  const [patientResults, setPatientResults] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [searchingPatients, setSearchingPatients] = useState(false);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const patientRef = useRef<HTMLDivElement>(null);

  // Doctors
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");

  // Form fields
  const [date, setDate] = useState(todayDateString());
  const [time, setTime] = useState(roundToNearest30(new Date()));
  const [appointmentType, setAppointmentType] = useState("NEW_VISIT");
  const [priority, setPriority] = useState("NORMAL");
  const [chiefComplaint, setChiefComplaint] = useState("");

  // Submit state
  const [submitting, setSubmitting] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setPatientQuery("");
      setSelectedPatient(null);
      setSelectedDoctorId("");
      setDate(todayDateString());
      setTime(roundToNearest30(new Date()));
      setAppointmentType("NEW_VISIT");
      setPriority("NORMAL");
      setChiefComplaint("");
    }
  }, [open]);

  // Fetch doctors on mount
  useEffect(() => {
    fetch("/api/doctors")
      .then((r) => r.json())
      .then((d) => setDoctors(Array.isArray(d) ? d : []))
      .catch(console.error);
  }, []);

  // Patient search with debounce
  const searchPatients = useCallback(async (q: string) => {
    if (!q.trim()) {
      setPatientResults([]);
      return;
    }
    setSearchingPatients(true);
    try {
      const res = await fetch(`/api/patients?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setPatientResults(Array.isArray(data) ? data.slice(0, 8) : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSearchingPatients(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchPatients(patientQuery), 350);
    return () => clearTimeout(t);
  }, [patientQuery, searchPatients]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (patientRef.current && !patientRef.current.contains(e.target as Node)) {
        setShowPatientDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPatient) {
      toast.error("Please select a patient.");
      return;
    }
    if (!selectedDoctorId) {
      toast.error("Please select a doctor.");
      return;
    }

    const dateTime = new Date(`${date}T${time}:00`);
    if (isNaN(dateTime.getTime())) {
      toast.error("Invalid date or time.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: selectedPatient.id,
          doctorId: selectedDoctorId,
          dateTime: dateTime.toISOString(),
          appointmentType,
          priority,
          chiefComplaint: chiefComplaint.trim() || undefined,
          walkIn: true,
          // Also auto-check-in the walk-in
          status: "CHECKED_IN",
        }),
      });

      if (!res.ok) {
        const msg = await res.text();
        toast.error(msg || "Failed to create walk-in booking.");
        return;
      }

      const appt = await res.json();
      toast.success(
        `Walk-in booked${appt.queueNumber ? ` — Queue #${appt.queueNumber}` : ""}!`,
        { description: `Patient: ${selectedPatient.user?.name}`, duration: 5000 }
      );
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg rounded-[2rem] p-0 overflow-hidden border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#0F172A] shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-500 p-6 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
                <UserRound size={22} />
              </div>
              Walk-In Patient
            </DialogTitle>
            <p className="text-emerald-100 text-sm font-medium mt-1">
              Instant booking — pre-filled with today's date and current time
            </p>
          </DialogHeader>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Patient Search */}
          <div ref={patientRef} className="relative">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
              Patient *
            </label>
            {selectedPatient ? (
              <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl">
                <div>
                  <p className="font-black text-sm text-slate-900 dark:text-slate-100">
                    {selectedPatient.user?.name}
                  </p>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                    Card #{selectedPatient.cardNumber || "N/A"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setSelectedPatient(null); setPatientQuery(""); }}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Search by name or card number..."
                  value={patientQuery}
                  onChange={(e) => {
                    setPatientQuery(e.target.value);
                    setShowPatientDropdown(true);
                  }}
                  onFocus={() => setShowPatientDropdown(true)}
                  className="w-full pl-9 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-600 transition-colors font-medium"
                />
                {searchingPatients && (
                  <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" size={16} />
                )}

                {showPatientDropdown && patientResults.length > 0 && (
                  <div className="absolute z-50 top-full mt-1 w-full bg-white dark:bg-[#111C3A] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden">
                    {patientResults.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedPatient(p);
                          setShowPatientDropdown(false);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors flex items-center justify-between border-b border-slate-100 dark:border-slate-800 last:border-0"
                      >
                        <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                          {p.user?.name}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          #{p.cardNumber}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {showPatientDropdown && patientQuery.length > 1 && !searchingPatients && patientResults.length === 0 && (
                  <div className="absolute z-50 top-full mt-1 w-full bg-white dark:bg-[#111C3A] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-4 text-center text-sm text-slate-500 font-medium">
                    No patients found
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Doctor */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
              Doctor *
            </label>
            <div className="relative">
              <Stethoscope className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="w-full pl-9 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors appearance-none cursor-pointer"
                required
              >
                <option value="">Select doctor...</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    Dr. {d.user?.name} — {d.specialization || d.department?.name || "General"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
                Date *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
                  required
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
                Time *
              </label>
              <div className="relative">
                <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full pl-9 pr-3 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
                  required
                />
              </div>
            </div>
          </div>

          {/* Type & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
                Visit Type
              </label>
              <select
                value={appointmentType}
                onChange={(e) => setAppointmentType(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors appearance-none cursor-pointer"
              >
                <option value="NEW_VISIT">New Visit</option>
                <option value="FOLLOW_UP">Follow-up</option>
                <option value="CONSULTATION">Consultation</option>
                <option value="EMERGENCY">Emergency</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
                Priority
              </label>
              <div className="relative">
                <AlertTriangle className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className={cn(
                    "w-full pl-9 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border rounded-2xl text-sm font-black focus:outline-none transition-colors appearance-none cursor-pointer",
                    priority === "EMERGENCY"
                      ? "border-rose-400 text-rose-600 dark:text-rose-400"
                      : priority === "URGENT"
                      ? "border-amber-400 text-amber-600 dark:text-amber-400"
                      : "border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                  )}
                >
                  <option value="NORMAL">Normal</option>
                  <option value="URGENT">Urgent</option>
                  <option value="EMERGENCY">Emergency</option>
                </select>
              </div>
            </div>
          </div>

          {/* Chief Complaint */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
              Chief Complaint
            </label>
            <div className="relative">
              <ClipboardList className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
              <textarea
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                placeholder="Briefly describe the reason for visit..."
                rows={2}
                className="w-full pl-9 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors font-medium resize-none"
              />
            </div>
          </div>

          {/* Walk-in badge notice */}
          <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl">
            <CheckCircle2 className="text-emerald-600 dark:text-emerald-400 shrink-0" size={16} />
            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
              This appointment will be marked as <span className="font-black">Walk-In</span> and auto-checked-in to the queue.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-sm font-black text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedPatient || !selectedDoctorId}
              className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white text-sm font-black transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Booking...
                </>
              ) : (
                <>
                  <UserRound size={16} />
                  Confirm Walk-In
                </>
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
