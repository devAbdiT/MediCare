"use client";

import React, { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PrintAppointmentButton from "@/components/PrintAppointmentButton";

import { cn } from "@/lib/utils";
import { format, isToday } from "date-fns";
import {
  Calendar,
  Clock,
  Stethoscope,
  CheckCircle2,
  XCircle,
  Loader2,
  CalendarDays,
  UserCheck,
  AlertTriangle,
  Hash,
  History,
  Filter,
  X,
  Printer,
  Search,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ─── Label maps ─────────────────────────────────────────────────────────────
const TYPE_LABELS: Record<string, string> = {
  NEW_VISIT: "New Visit",
  FOLLOW_UP: "Follow-up",
  CONSULTATION: "Consultation",
  EMERGENCY: "Emergency",
};

const PRIORITY_LABELS: Record<string, string> = {
  NORMAL: "Normal",
  URGENT: "Urgent",
  EMERGENCY: "Emergency",
};

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: "Scheduled",
  RESCHEDULED: "Rescheduled",
  CHECKED_IN: "Checked In",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  NO_SHOW: "No Show",
};

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900",
  RESCHEDULED: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900",
  CHECKED_IN: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900",
  COMPLETED: "bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700",
  CANCELLED: "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900",
  NO_SHOW: "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900",
};

const TYPE_COLORS: Record<string, string> = {
  NEW_VISIT: "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900",
  FOLLOW_UP: "bg-teal-50 text-teal-700 border-teal-100 dark:bg-teal-900/20 dark:text-teal-400 dark:border-teal-900",
  CONSULTATION: "bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-900",
  EMERGENCY: "bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900",
};

const PRIORITY_COLORS: Record<string, string> = {
  NORMAL: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  URGENT: "bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
  EMERGENCY: "bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800 animate-pulse font-black",
};

const todayStr = () => new Date().toISOString().split("T")[0];

// ─── Main Component ──────────────────────────────────────────────────────────
export default function ReceptionistSchedulePage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedApptDetails, setSelectedApptDetails] = useState<any | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDate, setFilterDate] = useState(todayStr());
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDoctorId, setFilterDoctorId] = useState("all");
  const [filterDepartmentId, setFilterDepartmentId] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  // Reschedule dialog
  const [rescheduleData, setRescheduleData] = useState<any | null>(null);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [availabilityMessage, setAvailabilityMessage] = useState("");
  const [doctorAvailability, setDoctorAvailability] = useState<any[]>([]);

  // Reminder
  const [markingReminder, setMarkingReminder] = useState<string | null>(null);

  // History dialog
  const [historyTarget, setHistoryTarget] = useState<any | null>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // No-Show confirm
  const [noShowTarget, setNoShowTarget] = useState<any | null>(null);
  // Cancel confirm
  const [cancelTarget, setCancelTarget] = useState<any | null>(null);

  // Build query URL from current filters
  const buildQueryURL = useCallback(() => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("search", searchQuery.trim());
    if (filterDate) params.set("date", filterDate);
    if (filterStatus !== "all") params.set("status", filterStatus);
    if (filterDoctorId !== "all") params.set("doctorId", filterDoctorId);
    if (filterDepartmentId !== "all") params.set("departmentId", filterDepartmentId);
    if (filterType !== "all") params.set("appointmentType", filterType);
    if (filterPriority !== "all") params.set("priority", filterPriority);
    return `/api/appointments/search?${params.toString()}`;
  }, [searchQuery, filterDate, filterStatus, filterDoctorId, filterDepartmentId, filterType, filterPriority]);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(buildQueryURL());
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setAppointments(data);
    } catch {
      toast.error("Failed to fetch schedule");
    } finally {
      setLoading(false);
    }
  }, [buildQueryURL]);

  // Fetch doctors and departments for filter dropdowns
  useEffect(() => {
    fetch("/api/doctors")
      .then((r) => r.json())
      .then((d) => setDoctors(Array.isArray(d) ? d : []))
      .catch(() => {});
    fetch("/api/departments")
      .then((r) => r.json())
      .then((d) => setDepartments(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  useEffect(() => {
    if (!rescheduleData) {
      setDoctorAvailability([]);
      return;
    }
    fetch(`/api/doctors/${rescheduleData.doctorId}/availability`)
      .then((r) => r.json())
      .then((d) => setDoctorAvailability(d))
      .catch(console.error);
  }, [rescheduleData]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const clearFilters = () => {
    setSearchQuery("");
    setFilterDate("");
    setFilterStatus("all");
    setFilterDoctorId("all");
    setFilterDepartmentId("all");
    setFilterType("all");
    setFilterPriority("all");
  };

  const activeFilterCount = [
    filterDate,
    filterStatus !== "all" ? filterStatus : "",
    filterDoctorId !== "all" ? filterDoctorId : "",
    filterDepartmentId !== "all" ? filterDepartmentId : "",
    filterType !== "all" ? filterType : "",
    filterPriority !== "all" ? filterPriority : "",
    searchQuery.trim(),
  ].filter(Boolean).length;

  const formatAvailability = () => {
    if (!doctorAvailability?.length) return "Loading availability...";
    const active = doctorAvailability.filter((a) => a.isActive);
    if (!active.length) return "Not available this week.";
    const isStandard = active.length === 5 && active.every((a) => a.dayOfWeek >= 1 && a.dayOfWeek <= 5 && a.startTime === "08:00" && a.endTime === "17:00");
    if (isStandard) return "Available Monday–Friday, 08:00–17:00";
    return `Working hours: ${active[0].startTime} – ${active[0].endTime}`;
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const labels: Record<string, string> = { COMPLETED: "completed", CANCELLED: "cancelled", CHECKED_IN: "checked in", NO_SHOW: "marked as no-show" };
        toast.success(`Appointment ${labels[newStatus] || newStatus.toLowerCase()}`);
        fetchAppointments();
      } else {
        toast.error((await res.text()) || "Failed to update status");
      }
    } catch {
      toast.error("An error occurred");
    }
  };

  const markReminderSent = async (id: string) => {
    setMarkingReminder(id);
    try {
      const res = await fetch(`/api/appointments/${id}/reminders`, { method: "POST" });
      if (res.ok) {
        toast.success("Reminder marked as sent!");
        fetchAppointments();
      } else {
        toast.error((await res.text()) || "Failed to mark reminder sent.");
      }
    } catch {
      toast.error("An error occurred.");
    } finally {
      setMarkingReminder(null);
    }
  };

  const handleNoShow = async () => {
    if (!noShowTarget) return;
    await updateStatus(noShowTarget.id, "NO_SHOW");
    setNoShowTarget(null);
  };

  const checkAvailability = async () => {
    if (!rescheduleData || !newDate || !newTime) return;
    setCheckingAvailability(true);
    setAvailable(null);
    setAvailabilityMessage("");
    try {
      const dateTime = new Date(`${newDate}T${newTime}`);
      const res = await fetch(`/api/appointments/check-availability?doctorId=${rescheduleData.doctorId}&dateTime=${dateTime.toISOString()}`);
      const data = await res.json();
      setAvailable(data.available);
      if (!data.available) {
        setAvailabilityMessage(data.message || "Doctor is not available at this time");
        toast.error(data.message || "Doctor is not available at this time");
      }
    } catch {
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
        body: JSON.stringify({ dateTime: dateTime.toISOString(), status: "SCHEDULED", reason: rescheduleReason }),
      });
      if (res.ok) {
        toast.success("Appointment rescheduled successfully");
        setRescheduleData(null);
        setRescheduleReason("");
        fetchAppointments();
      } else {
        toast.error((await res.text()) || "Failed to reschedule");
      }
    } catch {
      toast.error("An error occurred");
    }
  };

  const viewHistory = async (app: any) => {
    setHistoryTarget(app);
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/appointments/${app.id}/history`);
      setHistoryData(await res.json());
    } catch {
      toast.error("Failed to fetch history");
    } finally {
      setLoadingHistory(false);
    }
  };

  // ── Print filtered report ─────────────────────────────────────────────────
  const handlePrintReport = () => {
    window.print();
  };

  // ── Active filter summary for print header ────────────────────────────────
  const activeFilterSummary = () => {
    const parts: string[] = [];
    if (filterDate) parts.push(`Date: ${format(new Date(filterDate + "T12:00:00"), "MMMM dd, yyyy")}`);
    if (filterStatus !== "all") parts.push(`Status: ${STATUS_LABELS[filterStatus] || filterStatus}`);
    if (filterDoctorId !== "all") {
      const doc = doctors.find((d) => d.id === filterDoctorId);
      if (doc) parts.push(`Doctor: Dr. ${doc.user?.name}`);
    }
    if (filterDepartmentId !== "all") {
      const dept = departments.find((d) => d.id === filterDepartmentId);
      if (dept) parts.push(`Department: ${dept.name}`);
    }
    if (filterType !== "all") parts.push(`Type: ${TYPE_LABELS[filterType] || filterType}`);
    if (filterPriority !== "all") parts.push(`Priority: ${PRIORITY_LABELS[filterPriority] || filterPriority}`);
    if (searchQuery.trim()) parts.push(`Search: "${searchQuery.trim()}"`);
    return parts;
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout role="receptionist">
      <div className="max-w-7xl mx-auto space-y-6 pb-12">

        {/* ── Print-only report header ── */}
        <div className="hidden print:block mb-8">
          <div className="text-center border-b-2 border-slate-800 pb-6 mb-6">
            <h1 className="text-2xl font-black tracking-tighter text-slate-900">MediCare Appointment Scheduling System</h1>
            <h2 className="text-xl font-bold uppercase tracking-widest text-slate-700 mt-1">Appointment Report</h2>
            <p className="text-sm text-slate-500 mt-2">Generated: {format(new Date(), "MMMM dd, yyyy 'at' h:mm a")}</p>
          </div>
          {activeFilterSummary().length > 0 && (
            <div className="mb-6">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">Active Filters</p>
              <div className="flex flex-wrap gap-2">
                {activeFilterSummary().map((f, i) => (
                  <span key={i} className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-full border border-slate-300">{f}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Page Header ── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Appointment Schedule</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
              {filterDate ? format(new Date(filterDate + "T12:00:00"), "EEEE, MMMM do, yyyy") : "All appointments"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-colors ${
                showFilters || activeFilterCount > 0
                  ? "bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-none"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              <Filter size={16} />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-1 bg-white text-blue-600 text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
            <button
              onClick={handlePrintReport}
              className="flex items-center gap-2 px-5 py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-2xl font-bold text-sm hover:bg-slate-700 dark:hover:bg-slate-200 transition-colors"
            >
              <Printer size={16} />
              Print Report
            </button>
          </div>
        </div>



        {/* ── Filter Panel ── */}
        {showFilters && (
          <div className="bg-white dark:bg-[#0F172A] border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm print:hidden">
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">Filter Appointments</p>
              {activeFilterCount > 0 && (
                <button onClick={clearFilters} className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 font-bold transition-colors">
                  <X size={14} /> Clear All Filters
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <div className="lg:col-span-3 space-y-4">
                {/* Search */}
                <div className="lg:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Search</label>
                  <div className="relative">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Patient name, card number, phone..."
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-400 transition-colors"
                    />
                  </div>
                </div>

                {/* Date */}
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Date</label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Patient name, card number, phone..."
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-400 transition-colors"
                  />
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Date</label>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-400 transition-colors"
                />
              </div>

              {/* Status */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-400 transition-colors"
                >
                  <option value="all">All Statuses</option>
                  {Object.entries(STATUS_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Doctor */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Doctor</label>
                <select
                  value={filterDoctorId}
                  onChange={(e) => setFilterDoctorId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-400 transition-colors"
                >
                  <option value="all">All Doctors</option>
                  {doctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>Dr. {doc.user?.name} ({doc.specialization})</option>
                  ))}
                </select>
              </div>

              {/* Department */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Department</label>
                <select
                  value={filterDepartmentId}
                  onChange={(e) => setFilterDepartmentId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-400 transition-colors"
                >
                  <option value="all">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>

              {/* Type */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Appointment Type</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-400 transition-colors"
                >
                  <option value="all">All Types</option>
                  {Object.entries(TYPE_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Priority</label>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-400 transition-colors"
                >
                  <option value="all">All Priorities</option>
                  {Object.entries(PRIORITY_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick filter pills */}
            <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest self-center mr-2">Quick:</p>
              <button onClick={() => { setFilterDate(todayStr()); setFilterStatus("all"); }} className="px-3 py-1 text-xs font-bold rounded-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Today</button>
              <button onClick={() => { setFilterDate(todayStr()); setFilterStatus("CHECKED_IN"); }} className="px-3 py-1 text-xs font-bold rounded-full border border-emerald-200 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">Checked In</button>
              <button onClick={() => setFilterPriority("EMERGENCY")} className="px-3 py-1 text-xs font-bold rounded-full border border-rose-200 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors">Emergency Priority</button>
              <button onClick={() => { setFilterDate(todayStr()); setFilterStatus("NO_SHOW"); }} className="px-3 py-1 text-xs font-bold rounded-full border border-amber-200 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors">No Show</button>
            </div>
          </div>
        )}

        <div className="lg:col-span-3 space-y-4">
            {/* ── Result count ── */}
            <div className="flex items-center justify-between print:hidden">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {loading ? "Loading..." : `${appointments.length} appointment${appointments.length !== 1 ? "s" : ""} found`}
              </p>
            </div>

            {/* ── Table ── */}
            <div className="bg-white dark:bg-[#0F172A] rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors duration-500 print:border-none print:rounded-none print:shadow-none">
              <div className="overflow-x-auto print:overflow-visible">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest print:bg-slate-100">
                      <th className="px-6 py-5">No.</th>
                      <th className="px-6 py-5">Queue</th>
                      <th className="px-6 py-5">Date & Time</th>
                      <th className="px-6 py-5">Patient</th>
                      <th className="px-6 py-5">Doctor</th>
                      <th className="px-6 py-5">Status</th>
                      <th className="px-6 py-5 text-right print:hidden">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-900 print:divide-slate-200">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="px-8 py-20 text-center">
                          <Loader2 size={32} className="mx-auto text-blue-400 animate-spin mb-3" />
                          <p className="text-slate-400 font-medium">Loading schedule...</p>
                        </td>
                      </tr>
                    ) : appointments.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-8 py-20 text-center">
                          <CalendarDays size={48} className="mx-auto text-slate-200 dark:text-slate-700 mb-4" />
                          <p className="text-slate-500 font-bold">No appointments found for the selected filters.</p>
                          {activeFilterCount > 0 && (
                            <button onClick={clearFilters} className="mt-3 text-blue-500 text-sm font-bold hover:underline">Clear filters</button>
                          )}
                        </td>
                      </tr>
                    ) : (
                      appointments.map((app, idx) => (
                        <tr key={app.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors group print:hover:bg-transparent">
                          {/* No. */}
                          <td className="px-6 py-5 text-slate-400 font-bold text-sm">{idx + 1}</td>

                          {/* Queue */}
                          <td className="px-6 py-5">
                            {app.queueNumber ? (
                              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl print:border-emerald-300">
                                <Hash size={13} className="text-emerald-500" />
                                <span className="text-base font-black text-emerald-700 dark:text-emerald-400">{app.queueNumber}</span>
                              </div>
                            ) : (
                              <span className="text-slate-300 dark:text-slate-600 text-sm font-medium">—</span>
                            )}
                          </td>

                          {/* Date & Time */}
                          <td className="px-6 py-5">
                            <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                              {format(new Date(app.dateTime), "h:mm a")}
                            </div>
                            <div className="text-xs text-slate-400 font-medium mt-0.5">
                              {format(new Date(app.dateTime), "MMM dd, yyyy")}
                            </div>
                          </td>

                          {/* Patient */}
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center font-bold text-sm print:hidden">
                                {app.patient?.user?.name?.[0] || "?"}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">{app.patient?.user?.name || "Unknown"}</p>
                                {app.patient?.cardNumber && (
                                  <p className="text-[10px] text-slate-400 font-mono font-bold">{app.patient.cardNumber}</p>
                                )}
                                <p className="text-[10px] text-slate-400">{app.patient?.user?.phone || ""}</p>
                                <div className="flex gap-1 mt-1 flex-wrap">
                                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${TYPE_COLORS[app.appointmentType] || TYPE_COLORS.NEW_VISIT}`}>
                                    {TYPE_LABELS[app.appointmentType] || app.appointmentType}
                                  </span>
                                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${PRIORITY_COLORS[app.priority] || PRIORITY_COLORS.NORMAL}`}>
                                    {PRIORITY_LABELS[app.priority] || app.priority}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Doctor */}
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300 text-sm">
                              <Stethoscope size={15} className="text-slate-400 dark:text-slate-500 print:hidden" />
                              Dr. {app.doctor?.user?.name || "Unknown"}
                            </div>
                            {app.doctor?.specialization && (
                              <p className="text-[10px] text-slate-400 mt-0.5">{app.doctor.specialization}</p>
                            )}
                            {app.doctor?.department?.name && (
                              <p className="text-[10px] text-blue-500 dark:text-blue-400 font-bold">{app.doctor.department.name}</p>
                            )}
                          </td>

                          {/* Status */}
                          <td className="px-6 py-5">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${STATUS_COLORS[app.status] || STATUS_COLORS.SCHEDULED}`}>
                              {STATUS_LABELS[app.status] || app.status}
                            </span>
                            
                            {(app as any).paymentRequired && (app as any).paymentStatus === "PENDING" && (
                              <span className="block mt-1 w-max px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800">
                                Payment Pending
                              </span>
                            )}
                            {(app as any).paymentRequired && (app as any).paymentStatus === "PAID" && (
                              <span className="block mt-1 w-max px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800">
                                Paid
                              </span>
                            )}
                            {(app as any).paymentRequired && (app as any).paymentStatus === "FAILED" && (
                              <span className="block mt-1 w-max px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
                                Payment Failed
                              </span>
                            )}
                            {app.checkedInAt && app.status === "CHECKED_IN" && (
                              <p className="text-[10px] text-emerald-500 dark:text-emerald-400 font-medium mt-1">
                                at {format(new Date(app.checkedInAt), "h:mm a")}
                              </p>
                            )}
                            {/* Reminder status */}
                            <div className="mt-2">
                              {app.reminders?.length > 0 ? (
                                <div>
                                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Reminder: Sent</span>
                                  <p className="text-[9px] text-slate-400">at {format(new Date(app.reminders[0].sentAt), "MMM dd, h:mm a")}</p>
                                </div>
                              ) : (["SCHEDULED", "RESCHEDULED", "CHECKED_IN"].includes(app.status)) ? (
                                <div>
                                  <span className="text-[10px] font-bold text-slate-400 block mb-1">Reminder: Not Sent</span>
                                  <button
                                    onClick={() => markReminderSent(app.id)}
                                    disabled={markingReminder === app.id}
                                    className="text-[9px] px-2 py-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider rounded transition-colors disabled:opacity-50 print:hidden"
                                  >
                                    {markingReminder === app.id ? "Marking..." : "Mark Sent"}
                                  </button>
                                </div>
                              ) : null}
                            </div>
                          </td>

                          {/* Actions Dropdown */}
                          <td className="px-6 py-5 text-right print:hidden relative">
                            <div className="group inline-block relative z-10">
                              <button className="p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-xl transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none">
                                <MoreHorizontal size={20} />
                              </button>
                              <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl hidden group-hover:block hover:block z-50 overflow-hidden text-left py-1">
                                <button
                                  onClick={() => window.open(`/api/print/appointment/${app.id}`, '_blank')}
                                  className="w-full text-left px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
                                >
                                  <Printer size={15} /> Print Slip
                                </button>
                                
                                {app.status === "SCHEDULED" && (
                                  <>
                                    <button 
                                      onClick={() => {
                                        if ((app as any).paymentRequired && (app as any).paymentStatus !== "PAID") {
                                          toast.error("Payment must be completed before check-in.");
                                          return;
                                        }
                                        updateStatus(app.id, "CHECKED_IN")
                                      }} 
                                      disabled={(app as any).paymentRequired && (app as any).paymentStatus !== "PAID"}
                                      className="w-full text-left px-4 py-2.5 text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      <UserCheck size={15} /> Check In
                                    </button>
                                    <button 
                                      onClick={() => setRescheduleData(app)} 
                                      className="w-full text-left px-4 py-2.5 text-sm font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex items-center gap-2"
                                    >
                                      <Calendar size={15} /> Reschedule
                                    </button>
                                    <button 
                                      onClick={() => setNoShowTarget(app)} 
                                      className="w-full text-left px-4 py-2.5 text-sm font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors flex items-center gap-2"
                                    >
                                      <AlertTriangle size={15} /> Mark No-Show
                                    </button>
                                    <button 
                                      onClick={() => setCancelTarget(app)} 
                                      className="w-full text-left px-4 py-2.5 text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"
                                    >
                                      <XCircle size={15} /> Cancel
                                    </button>
                                  </>
                                )}
                                
                                {app.status === "CHECKED_IN" && (
                                  <>
                                    <button 
                                      onClick={() => updateStatus(app.id, "COMPLETED")} 
                                      className="w-full text-left px-4 py-2.5 text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors flex items-center gap-2"
                                    >
                                      <CheckCircle2 size={15} /> Mark Completed
                                    </button>
                                    <button 
                                      onClick={() => setNoShowTarget(app)} 
                                      className="w-full text-left px-4 py-2.5 text-sm font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors flex items-center gap-2"
                                    >
                                      <AlertTriangle size={15} /> Mark No-Show
                                    </button>
                                  </>
                                )}
                                
                                <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>
                                <button 
                                  onClick={() => viewHistory(app)} 
                                  className="w-full text-left px-4 py-2.5 text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
                                >
                                  <History size={15} /> View History
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Print footer */}
              <div className="hidden print:block px-6 py-4 border-t-2 border-slate-200 mt-4">
                <p className="text-sm font-bold text-slate-700">Total Appointments: {appointments.length}</p>
                <p className="text-xs text-slate-500 mt-1">This is a system-generated appointment report. — MediCare Appointment Scheduling System</p>
              </div>
            </div>
              </div>
            </div>

        {/* ── Reschedule Dialog ── */}
        <Dialog open={!!rescheduleData} onOpenChange={() => setRescheduleData(null)}>
          <DialogContent className="sm:max-w-md rounded-[2.5rem] p-8 border-slate-100 dark:border-slate-800 bg-white dark:bg-[#0F172A] shadow-2xl transition-colors duration-500">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-slate-900 dark:text-slate-100">Reschedule Appointment</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 pt-4">
              {doctorAvailability.length > 0 && (
                <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900 flex items-start gap-3">
                  <Clock className="text-blue-500 mt-0.5 shrink-0" size={18} />
                  <div>
                    <p className="text-sm font-bold text-blue-900 dark:text-blue-100">Doctor Working Hours</p>
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mt-1">{formatAvailability()}</p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">New Date</label>
                  <input type="date" value={newDate} min={new Date().toISOString().split("T")[0]} onChange={(e) => { setNewDate(e.target.value); setAvailable(null); }} className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 border-2 border-transparent rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:border-blue-600 outline-none transition-all font-bold text-slate-900 dark:text-slate-100" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">New Time</label>
                  <select value={newTime} onChange={(e) => { setNewTime(e.target.value); setAvailable(null); }} className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 border-2 border-transparent rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:border-blue-600 outline-none transition-all font-bold text-slate-900 dark:text-slate-100 appearance-none">
                    <option value="">Select time</option>
                    {Array.from({ length: 9 }, (_, i) => i + 9).map((hour) => {
                      const h = hour < 10 ? `0${hour}` : `${hour}`;
                      const label = hour > 12 ? `${hour - 12}:00 PM` : hour === 12 ? `12:00 PM` : `${hour}:00 AM`;
                      return <option key={hour} value={`${h}:00:00`}>{label}</option>;
                    })}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Reschedule Reason</label>
                <textarea value={rescheduleReason} onChange={(e) => setRescheduleReason(e.target.value)} placeholder="Doctor unavailable, Patient requested, etc." rows={2} className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 border-2 border-transparent rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:border-blue-600 outline-none transition-all font-medium text-slate-900 dark:text-slate-100 resize-none" />
              </div>
              <button type="button" onClick={checkAvailability} disabled={!newDate || !newTime || checkingAvailability} className="w-full py-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl font-black hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                {checkingAvailability ? <Loader2 className="animate-spin" /> : <Clock size={20} />}
                Check Slot Availability
              </button>
              {available === true && <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-900 flex items-center gap-3 text-emerald-700 dark:text-emerald-400 font-bold"><CheckCircle2 size={24} /> Slot is Available</div>}
              {available === false && <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-900 flex items-center gap-3 text-red-700 dark:text-red-400 font-bold"><AlertTriangle size={24} /> {availabilityMessage || "Slot is Unavailable"}</div>}
              <button type="button" onClick={handleReschedule} disabled={!available || rescheduleReason.trim().length < 3} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-all disabled:opacity-50 disabled:bg-slate-300">
                Confirm Reschedule
              </button>
            </div>
          </DialogContent>
        </Dialog>

        {/* ── No-Show Dialog ── */}
        <Dialog open={!!noShowTarget} onOpenChange={() => setNoShowTarget(null)}>
          <DialogContent className="sm:max-w-md rounded-[2.5rem] p-8 border-slate-100 dark:border-slate-800 bg-white dark:bg-[#0F172A] shadow-2xl transition-colors duration-500">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-slate-900 dark:text-slate-100">Mark as No-Show</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 pt-4">
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-200 dark:border-amber-800 flex items-start gap-3">
                <AlertTriangle size={22} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold text-amber-800 dark:text-amber-300 text-sm">Are you sure you want to mark this appointment as no-show?</p>
                  <p className="text-amber-600 dark:text-amber-400 text-xs mt-1">This action indicates the patient did not attend.</p>
                </div>
              </div>
              {noShowTarget && (
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl space-y-2">
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100"><span className="text-slate-500">Patient:</span> {noShowTarget.patient?.user?.name}</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100"><span className="text-slate-500">Doctor:</span> Dr. {noShowTarget.doctor?.user?.name}</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100"><span className="text-slate-500">Time:</span> {format(new Date(noShowTarget.dateTime), "h:mm a, MMM dd yyyy")}</p>
                </div>
              )}
              <div className="flex gap-3">
                <button type="button" onClick={() => setNoShowTarget(null)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl font-black hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">Cancel</button>
                <button type="button" onClick={handleNoShow} className="flex-1 py-4 bg-amber-500 text-white rounded-2xl font-black hover:bg-amber-600 transition-all">Confirm No-Show</button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* ── Cancel Confirmation Dialog ── */}
        <Dialog open={!!cancelTarget} onOpenChange={() => setCancelTarget(null)}>
          <DialogContent className="sm:max-w-md rounded-[2.5rem] p-8 border-slate-100 dark:border-slate-800 bg-white dark:bg-[#0F172A] shadow-2xl transition-colors duration-500">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-2xl flex items-center justify-center">
                  <XCircle size={22} className="text-red-600 dark:text-red-400" />
                </div>
                Cancel Appointment
              </DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Are you sure you want to cancel the appointment for <span className="font-bold text-slate-900 dark:text-slate-100">{cancelTarget?.patient?.user?.name}</span>? 
                This action will mark the status as cancelled and free up the doctor's time slot.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setCancelTarget(null)}
                className="flex-1 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-sm font-black text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={() => {
                  updateStatus(cancelTarget.id, "CANCELLED");
                  setCancelTarget(null);
                }}
                className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-700 hover:to-rose-600 text-white text-sm font-black transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
              >
                <XCircle size={16} /> Confirm Cancel
              </button>
            </div>
          </DialogContent>
        </Dialog>

        {/* ── History Dialog ── */}
        <Dialog open={!!historyTarget} onOpenChange={() => setHistoryTarget(null)}>
          <DialogContent className="sm:max-w-md rounded-[2.5rem] p-8 border-slate-100 dark:border-slate-800 bg-white dark:bg-[#0F172A] shadow-2xl transition-colors duration-500 max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <History className="text-blue-500" /> Appointment History
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              {loadingHistory ? (
                <div className="flex justify-center p-8 text-slate-400"><Loader2 className="animate-spin" size={24} /></div>
              ) : historyData.length === 0 ? (
                <div className="text-center p-8 bg-slate-50 dark:bg-slate-900/50 rounded-2xl text-slate-500">
                  <p className="font-medium">No history recorded for this appointment.</p>
                </div>
              ) : (
                historyData.map((h) => (
                  <div key={h.id} className="p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">{h.actionType || "UPDATE"}</span>
                      <span className="text-xs text-slate-400 font-medium">{format(new Date(h.createdAt), "MMM dd, yyyy h:mm a")}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                      <div className="bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-100 dark:border-slate-700">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Previous</p>
                        <p className="font-medium text-slate-600 dark:text-slate-300">{h.oldDateTime ? format(new Date(h.oldDateTime), "MMM dd, h:mm a") : "—"}</p>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/10 p-2 rounded-xl border border-blue-100 dark:border-blue-900">
                        <p className="text-[10px] text-blue-500 dark:text-blue-400 font-bold uppercase tracking-wider mb-1">New</p>
                        <p className="font-medium text-blue-700 dark:text-blue-300">{h.newDateTime ? format(new Date(h.newDateTime), "MMM dd, h:mm a") : "—"}</p>
                      </div>
                    </div>
                    {h.reason && <div className="mt-2"><p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Reason</p><p className="text-sm font-medium text-slate-700 dark:text-slate-300">&quot;{h.reason}&quot;</p></div>}
                    {h.changedByName && <p className="text-xs text-slate-400 font-medium mt-2 flex justify-end">Changed by: {h.changedByName} ({h.changedByRole})</p>}
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* ── Appointment Details Dialog ── */}
        <Dialog open={!!selectedApptDetails} onOpenChange={() => setSelectedApptDetails(null)}>
          <DialogContent className="sm:max-w-lg rounded-[2.5rem] p-8 border-slate-100 dark:border-slate-800 bg-white dark:bg-[#0F172A] shadow-2xl transition-colors duration-500 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-slate-900 dark:text-slate-100">
                Appointment Details
              </DialogTitle>
            </DialogHeader>
            {selectedApptDetails && (
              <div className="space-y-6 pt-4">
                {/* Patient Profile info */}
                <div className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient Information</p>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">{selectedApptDetails.patient?.user?.name}</h3>
                    {selectedApptDetails.patient?.cardNumber && (
                      <p className="text-xs font-mono font-bold text-slate-500 mt-0.5">Card Number: {selectedApptDetails.patient.cardNumber}</p>
                    )}
                    {selectedApptDetails.patient?.user?.phone && (
                      <p className="text-xs text-slate-500 mt-0.5">Phone: {selectedApptDetails.patient.user.phone}</p>
                    )}
                    {selectedApptDetails.patient?.user?.email && (
                      <p className="text-xs text-slate-500 mt-0.5">Email: {selectedApptDetails.patient.user.email}</p>
                    )}
                  </div>
                </div>

                {/* Consultation Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Doctor</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Dr. {selectedApptDetails.doctor?.user?.name}</p>
                    {selectedApptDetails.doctor?.specialization && (
                      <p className="text-[10px] text-slate-450">{selectedApptDetails.doctor.specialization}</p>
                    )}
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Date & Time</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{format(new Date(selectedApptDetails.dateTime), "h:mm a")}</p>
                    <p className="text-[10px] text-slate-450">{format(new Date(selectedApptDetails.dateTime), "MMM dd, yyyy")}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Status</p>
                    <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${STATUS_COLORS[selectedApptDetails.status] || STATUS_COLORS.SCHEDULED}`}>
                      {STATUS_LABELS[selectedApptDetails.status] || selectedApptDetails.status}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Type</p>
                    <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${TYPE_COLORS[selectedApptDetails.appointmentType] || TYPE_COLORS.NEW_VISIT}`}>
                      {TYPE_LABELS[selectedApptDetails.appointmentType] || selectedApptDetails.appointmentType}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Priority</p>
                    <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${PRIORITY_COLORS[selectedApptDetails.priority] || PRIORITY_COLORS.NORMAL}`}>
                      {PRIORITY_LABELS[selectedApptDetails.priority] || selectedApptDetails.priority}
                    </span>
                  </div>
                </div>

                {selectedApptDetails.reason && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Reason for Visit</p>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 italic">
                      &quot;{selectedApptDetails.reason}&quot;
                    </p>
                  </div>
                )}

                {selectedApptDetails.queueNumber && (
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100 dark:border-emerald-900 flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Queue Status</p>
                      <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">Checked-in and queued</p>
                    </div>
                    <div className="flex items-center gap-1 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/50 border border-emerald-300 dark:border-emerald-800 rounded-xl">
                      <Hash size={14} className="text-emerald-600 dark:text-emerald-400" />
                      <span className="text-lg font-black text-emerald-700 dark:text-emerald-355">Q{selectedApptDetails.queueNumber}</span>
                    </div>
                  </div>
                )}

                {/* Reminder Log inside popup */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Reminder Log</p>
                    {selectedApptDetails.reminders?.length > 0 ? (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                        Sent at {format(new Date(selectedApptDetails.reminders[0].sentAt), "MMM dd, h:mm a")}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-500 font-medium mt-1">No reminder recorded yet</p>
                    )}
                  </div>
                  {(!selectedApptDetails.reminders || selectedApptDetails.reminders.length === 0) &&
                    ["SCHEDULED", "RESCHEDULED", "CHECKED_IN"].includes(selectedApptDetails.status) && (
                      <button
                        onClick={async () => {
                          const apptId = selectedApptDetails.id;
                          await markReminderSent(apptId);
                          setSelectedApptDetails(null);
                        }}
                        disabled={markingReminder === selectedApptDetails.id}
                        className="px-4 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-black text-xs uppercase tracking-widest rounded-xl transition-colors disabled:opacity-50"
                      >
                        {markingReminder === selectedApptDetails.id ? "Marking..." : "Mark Sent"}
                      </button>
                    )}
                </div>

                {/* Action buttons inside details popup */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <p className="text-[9px] font-black text-slate-450 uppercase tracking-widest">Reception Actions</p>
                  <div className="flex flex-wrap gap-2.5">
                    {selectedApptDetails.status === "SCHEDULED" && (
                      <>
                        <button
                          onClick={() => {
                            updateStatus(selectedApptDetails.id, "CHECKED_IN");
                            setSelectedApptDetails(null);
                          }}
                          className="flex-1 min-w-[120px] py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all cursor-pointer"
                        >
                          Check In
                        </button>
                        <button
                          onClick={() => {
                            setRescheduleData(selectedApptDetails);
                            setSelectedApptDetails(null);
                          }}
                          className="flex-1 min-w-[120px] py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all cursor-pointer"
                        >
                          Reschedule
                        </button>
                        <button
                          onClick={() => {
                            setNoShowTarget(selectedApptDetails);
                            setSelectedApptDetails(null);
                          }}
                          className="flex-1 min-w-[120px] py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all cursor-pointer"
                        >
                          Mark No-Show
                        </button>
                        <button
                          onClick={() => {
                            setCancelTarget(selectedApptDetails);
                            setSelectedApptDetails(null);
                          }}
                          className="flex-1 min-w-[120px] py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all cursor-pointer"
                        >
                          Cancel Appointment
                        </button>
                      </>
                    )}

                    {selectedApptDetails.status === "CHECKED_IN" && (
                      <>
                        <button
                          onClick={() => {
                            updateStatus(selectedApptDetails.id, "COMPLETED");
                            setSelectedApptDetails(null);
                          }}
                          className="flex-1 min-w-[120px] py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all cursor-pointer"
                        >
                          Mark Completed
                        </button>
                        <button
                          onClick={() => {
                            setNoShowTarget(selectedApptDetails);
                            setSelectedApptDetails(null);
                          }}
                          className="flex-1 min-w-[120px] py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all cursor-pointer"
                        >
                          Mark No-Show
                        </button>
                      </>
                    )}

                    <div className="w-full flex gap-2 items-center">
                      <PrintAppointmentButton appointment={selectedApptDetails} variant="solid" />
                      <button
                        onClick={() => {
                          viewHistory(selectedApptDetails);
                          setSelectedApptDetails(null);
                        }}
                        className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all cursor-pointer"
                      >
                        View Reschedule History
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
    </DashboardLayout>
  );
}
