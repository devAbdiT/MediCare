"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { SearchBar } from "@/components/SearchBar";
import { format, isToday } from "date-fns";
import {
  Calendar,
  Clock,
  User,
  Stethoscope,
  CheckCircle2,
  XCircle,
  Printer,
  Loader2,
  CalendarDays,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ReceptionistSchedulePage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAll, setShowAll] = useState(false);

  // Reschedule Dialog state
  const [rescheduleData, setRescheduleData] = useState<any | null>(null);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);

  const fetchAppointments = async (q = "") => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/appointments/search?q=${encodeURIComponent(q)}`,
      );
      const data = await res.json();

      // Filter for today's appointments by default if no query and showAll is false
      let filtered = data;
      if (!q && !showAll) {
        filtered = data.filter((app: any) => isToday(new Date(app.dateTime)));
      }

      setAppointments(filtered);
    } catch (err) {
      toast.error("Failed to fetch schedule");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments(searchQuery);
  }, [showAll]);

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    fetchAppointments(q);
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast.success(`Appointment marked as ${newStatus.toLowerCase()}`);
        fetchAppointments(searchQuery);
      } else {
        toast.error("Failed to update status");
      }
    } catch (err) {
      toast.error("An error occurred");
    }
  };

  const checkAvailability = async () => {
    if (!rescheduleData || !newDate || !newTime) return;

    setCheckingAvailability(true);
    setAvailable(null);

    const dateTime = new Date(`${newDate}T${newTime}`);

    try {
      const res = await fetch(
        `/api/appointments/check-availability?doctorId=${rescheduleData.doctorId}&dateTime=${dateTime.toISOString()}`,
      );
      const data = await res.json();
      setAvailable(data.available);
      if (!data.available) {
        toast.error("Doctor is already booked at this time");
      }
    } catch (err) {
      toast.error("Error checking availability");
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleReschedule = async () => {
    if (!rescheduleData || !available) return;

    try {
      const dateTime = new Date(`${newDate}T${newTime}`);
      const res = await fetch(`/api/appointments/${rescheduleData.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dateTime: dateTime.toISOString(),
          status: "SCHEDULED",
        }),
      });

      if (res.ok) {
        toast.success("Appointment rescheduled successfully");
        setRescheduleData(null);
        fetchAppointments(searchQuery);
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to reschedule");
      }
    } catch (err) {
      toast.error("An error occurred");
    }
  };

  const statusColors = {
    SCHEDULED:
      "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900",
    COMPLETED:
      "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900",
    CANCELLED:
      "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900",
  };

  return (
    <DashboardLayout role="receptionist">
      <div className="max-w-6xl mx-auto space-y-8 pb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {showAll ? "Master Schedule" : "Today's Schedule"}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg font-medium">
              {showAll
                ? "All upcoming appointments"
                : format(new Date(), "EEEE, MMMM do, yyyy")}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowAll(!showAll)}
              className="px-6 py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-2xl font-bold transition-colors print:hidden"
            >
              {showAll ? "View Today Only" : "View All Schedules"}
            </button>
          </div>
        </div>

        <div className="print:hidden">
          <SearchBar
            onSearch={handleSearch}
            placeholder="Search schedule by patient or doctor name..."
            isSearching={loading}
          />
        </div>

        <div className="bg-white dark:bg-[#0F172A] rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors duration-500">
          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest">
                  <th className="px-8 py-6">Time</th>
                  <th className="px-8 py-6">Patient</th>
                  <th className="px-8 py-6">Doctor</th>
                  <th className="px-8 py-6">Status</th>
                  <th className="px-8 py-6 text-right print:hidden">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-900">
                {appointments.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center">
                      <CalendarDays
                        size={48}
                        className="mx-auto text-slate-200 mb-4"
                      />
                      <p className="text-slate-500 font-bold">
                        No appointments scheduled.
                      </p>
                    </td>
                  </tr>
                ) : (
                  appointments.map((app) => (
                    <tr
                      key={app.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors group"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
                          <Clock size={16} className="text-blue-500" />
                          {format(new Date(app.dateTime), "h:mm a")}
                        </div>
                        <div className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-1">
                          {format(new Date(app.dateTime), "MMM dd, yyyy")}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center font-bold">
                            {app.patient?.user?.name[0] || "?"}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-slate-100">
                              {app.patient?.user?.name || "Unknown"}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {app.patient?.user?.phone || "No phone"}
                            </p>
                            <div className="flex gap-1.5 mt-1.5 flex-wrap">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                                (app.appointmentType || "NEW_VISIT") === "NEW_VISIT" ? "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900" :
                                (app.appointmentType || "NEW_VISIT") === "FOLLOW_UP" ? "bg-teal-50 text-teal-700 border-teal-100 dark:bg-teal-900/20 dark:text-teal-400 dark:border-teal-900" :
                                (app.appointmentType || "NEW_VISIT") === "CONSULTATION" ? "bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-900" :
                                "bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900"
                              }`}>
                                {(app.appointmentType || "NEW_VISIT").replace("_", " ")}
                              </span>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                (app.priority || "NORMAL") === "URGENT" ? "bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800" :
                                (app.priority || "NORMAL") === "EMERGENCY" ? "bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800 animate-pulse font-black" :
                                "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                              }`}>
                                {app.priority || "NORMAL"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300">
                          <Stethoscope
                            size={16}
                            className="text-slate-400 dark:text-slate-500"
                          />
                          Dr. {app.doctor?.user?.name || "Unknown"}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${statusColors[app.status as keyof typeof statusColors]}`}
                        >
                          {app.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right print:hidden">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {app.status === "SCHEDULED" && (
                            <>
                              <button
                                onClick={() =>
                                  updateStatus(app.id, "COMPLETED")
                                }
                                className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-colors tooltip-trigger"
                                title="Mark Completed"
                              >
                                <CheckCircle2 size={18} />
                              </button>
                              <button
                                onClick={() => setRescheduleData(app)}
                                className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors tooltip-trigger"
                                title="Reschedule"
                              >
                                <Calendar size={18} />
                              </button>
                              <button
                                onClick={() =>
                                  updateStatus(app.id, "CANCELLED")
                                }
                                className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors tooltip-trigger"
                                title="Cancel"
                              >
                                <XCircle size={18} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Reschedule Dialog */}
      <Dialog
        open={!!rescheduleData}
        onOpenChange={() => setRescheduleData(null)}
      >
        <DialogContent className="sm:max-w-md rounded-[2.5rem] p-8 border-slate-100 dark:border-slate-800 bg-white dark:bg-[#0F172A] shadow-2xl transition-colors duration-500">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-slate-900 dark:text-slate-100">
              Reschedule Appointment
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
                  New Date
                </label>
                <input
                  type="date"
                  value={newDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => {
                    setNewDate(e.target.value);
                    setAvailable(null);
                  }}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 border-2 border-transparent rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:border-blue-600 outline-none transition-all font-bold text-slate-900 dark:text-slate-100"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
                  New Time
                </label>
                <select
                  value={newTime}
                  onChange={(e) => {
                    setNewTime(e.target.value);
                    setAvailable(null);
                  }}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 border-2 border-transparent rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:border-blue-600 outline-none transition-all font-bold text-slate-900 dark:text-slate-100 appearance-none"
                >
                  <option value="">Select time</option>
                  {Array.from({ length: 9 }, (_, i) => i + 9).map((hour) => {
                    const formattedHour = hour < 10 ? `0${hour}` : hour;
                    const label =
                      hour > 12
                        ? `${hour - 12}:00 PM`
                        : hour === 12
                          ? `12:00 PM`
                          : `${hour}:00 AM`;
                    return (
                      <option key={hour} value={`${formattedHour}:00:00`}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={checkAvailability}
              disabled={!newDate || !newTime || checkingAvailability}
              className="w-full py-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl font-black hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {checkingAvailability ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Clock size={20} />
              )}
              Check Slot Availability
            </button>

            {available === true && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-900 flex items-center gap-3 text-emerald-700 dark:text-emerald-400 font-bold">
                <CheckCircle2 size={24} />
                Slot is Available
              </div>
            )}

            <button
              type="button"
              onClick={handleReschedule}
              disabled={!available}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-all disabled:opacity-50 disabled:bg-slate-300"
            >
              Confirm Reschedule
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
