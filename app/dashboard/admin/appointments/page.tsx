"use client";

import React, { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { format } from "date-fns";
import {
  Calendar,
  Clock,
  Stethoscope,
  User,
  Filter,
  X,
  Search,
  Printer,
  Loader2,
  CalendarDays,
} from "lucide-react";

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
  SCHEDULED: "bg-blue-50 text-blue-600 border-blue-200",
  RESCHEDULED: "bg-indigo-50 text-indigo-600 border-indigo-200",
  CHECKED_IN: "bg-emerald-50 text-emerald-600 border-emerald-200",
  COMPLETED: "bg-slate-100 text-slate-600 border-slate-200",
  CANCELLED: "bg-red-50 text-red-600 border-red-200",
  NO_SHOW: "bg-amber-50 text-amber-600 border-amber-200",
};

const TYPE_COLORS: Record<string, string> = {
  NEW_VISIT: "bg-blue-50 text-blue-700 border-blue-100",
  FOLLOW_UP: "bg-teal-50 text-teal-700 border-teal-100",
  CONSULTATION: "bg-purple-50 text-purple-700 border-purple-100",
  EMERGENCY: "bg-red-50 text-red-700 border-red-100",
};

const PRIORITY_COLORS: Record<string, string> = {
  NORMAL: "bg-slate-100 text-slate-700",
  URGENT: "bg-amber-100 text-amber-700 border border-amber-200",
  EMERGENCY: "bg-rose-100 text-rose-700 border border-rose-200 animate-pulse font-black",
};

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDoctorId, setFilterDoctorId] = useState("all");
  const [filterDepartmentId, setFilterDepartmentId] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

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
      setAppointments(await res.json());
    } catch {
      console.error("Failed to fetch appointments");
    } finally {
      setLoading(false);
    }
  }, [buildQueryURL]);

  useEffect(() => {
    fetch("/api/doctors").then((r) => r.json()).then((d) => setDoctors(Array.isArray(d) ? d : [])).catch(() => {});
    fetch("/api/departments").then((r) => r.json()).then((d) => setDepartments(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const clearFilters = () => {
    setSearchQuery(""); setFilterDate(""); setFilterStatus("all");
    setFilterDoctorId("all"); setFilterDepartmentId("all");
    setFilterType("all"); setFilterPriority("all");
  };

  const activeFilterCount = [
    filterDate,
    filterStatus !== "all" ? "x" : "",
    filterDoctorId !== "all" ? "x" : "",
    filterDepartmentId !== "all" ? "x" : "",
    filterType !== "all" ? "x" : "",
    filterPriority !== "all" ? "x" : "",
    searchQuery.trim(),
  ].filter(Boolean).length;

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

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">

        {/* Print-only header */}
        <div className="hidden print:block mb-8">
          <div className="text-center border-b-2 border-slate-800 pb-6 mb-6">
            <h1 className="text-2xl font-black tracking-tighter text-slate-900">MediCare Appointment Scheduling System</h1>
            <h2 className="text-xl font-bold uppercase tracking-widest text-slate-700 mt-1">Admin Appointment Report</h2>
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

        {/* Page header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
          <div>
            <h1 className="text-4xl font-black text-[#1A2A4A] dark:text-[#E8EEF8] tracking-tight">Master Schedule</h1>
            <p className="text-[#5A6E8A] dark:text-[#8A9CBA] mt-2 font-medium">Overview of all clinic appointments</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-colors ${
                showFilters || activeFilterCount > 0
                  ? "bg-[#1E4A8A] text-white"
                  : "bg-[#F0F4F8] dark:bg-[#0A122A] text-[#5A6E8A] dark:text-[#8A9CBA] hover:bg-[#D0DCE8] dark:hover:bg-[#1A2A4A]"
              }`}
            >
              <Filter size={16} />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-1 bg-white text-[#1E4A8A] text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-5 py-3 bg-[#1A2A4A] dark:bg-[#E8EEF8] text-white dark:text-[#1A2A4A] rounded-2xl font-bold text-sm hover:bg-[#1E4A8A] transition-colors"
            >
              <Printer size={16} />
              Print Report
            </button>
          </div>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="bg-white dark:bg-[#111C3A] border border-[#D0DCE8] dark:border-[#1A2A4A] rounded-[2rem] p-6 shadow-sm print:hidden">
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm font-black text-[#1A2A4A] dark:text-[#E8EEF8] uppercase tracking-widest">Filter Appointments</p>
              {activeFilterCount > 0 && (
                <button onClick={clearFilters} className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 font-bold">
                  <X size={14} /> Clear All
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-2">
                <label className="text-[10px] font-black text-[#5A6E8A] uppercase tracking-widest block mb-1.5">Search</label>
                <div className="relative">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5A6E8A]" />
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Patient name, card number, phone..." className="w-full pl-9 pr-4 py-2.5 bg-[#F0F4F8] dark:bg-[#0A122A] border border-[#D0DCE8] dark:border-[#1A2A4A] rounded-xl text-sm text-[#1A2A4A] dark:text-[#E8EEF8] focus:outline-none focus:border-[#1E4A8A] transition-colors" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-[#5A6E8A] uppercase tracking-widest block mb-1.5">Date</label>
                <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="w-full px-3 py-2.5 bg-[#F0F4F8] dark:bg-[#0A122A] border border-[#D0DCE8] dark:border-[#1A2A4A] rounded-xl text-sm text-[#1A2A4A] dark:text-[#E8EEF8] focus:outline-none focus:border-[#1E4A8A] transition-colors" />
              </div>
              <div>
                <label className="text-[10px] font-black text-[#5A6E8A] uppercase tracking-widest block mb-1.5">Status</label>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full px-3 py-2.5 bg-[#F0F4F8] dark:bg-[#0A122A] border border-[#D0DCE8] dark:border-[#1A2A4A] rounded-xl text-sm text-[#1A2A4A] dark:text-[#E8EEF8] focus:outline-none focus:border-[#1E4A8A] transition-colors">
                  <option value="all">All Statuses</option>
                  {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-[#5A6E8A] uppercase tracking-widest block mb-1.5">Doctor</label>
                <select value={filterDoctorId} onChange={(e) => setFilterDoctorId(e.target.value)} className="w-full px-3 py-2.5 bg-[#F0F4F8] dark:bg-[#0A122A] border border-[#D0DCE8] dark:border-[#1A2A4A] rounded-xl text-sm text-[#1A2A4A] dark:text-[#E8EEF8] focus:outline-none focus:border-[#1E4A8A] transition-colors">
                  <option value="all">All Doctors</option>
                  {doctors.map((doc) => <option key={doc.id} value={doc.id}>Dr. {doc.user?.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-[#5A6E8A] uppercase tracking-widest block mb-1.5">Department</label>
                <select value={filterDepartmentId} onChange={(e) => setFilterDepartmentId(e.target.value)} className="w-full px-3 py-2.5 bg-[#F0F4F8] dark:bg-[#0A122A] border border-[#D0DCE8] dark:border-[#1A2A4A] rounded-xl text-sm text-[#1A2A4A] dark:text-[#E8EEF8] focus:outline-none focus:border-[#1E4A8A] transition-colors">
                  <option value="all">All Departments</option>
                  {departments.map((dept) => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-[#5A6E8A] uppercase tracking-widest block mb-1.5">Type</label>
                <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-full px-3 py-2.5 bg-[#F0F4F8] dark:bg-[#0A122A] border border-[#D0DCE8] dark:border-[#1A2A4A] rounded-xl text-sm text-[#1A2A4A] dark:text-[#E8EEF8] focus:outline-none focus:border-[#1E4A8A] transition-colors">
                  <option value="all">All Types</option>
                  {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-[#5A6E8A] uppercase tracking-widest block mb-1.5">Priority</label>
                <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="w-full px-3 py-2.5 bg-[#F0F4F8] dark:bg-[#0A122A] border border-[#D0DCE8] dark:border-[#1A2A4A] rounded-xl text-sm text-[#1A2A4A] dark:text-[#E8EEF8] focus:outline-none focus:border-[#1E4A8A] transition-colors">
                  <option value="all">All Priorities</option>
                  {Object.entries(PRIORITY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Result count */}
        <p className="text-sm font-medium text-[#5A6E8A] dark:text-[#8A9CBA] print:hidden">
          {loading ? "Loading..." : `${appointments.length} appointment${appointments.length !== 1 ? "s" : ""} found`}
        </p>

        {/* Table */}
        <div className="bg-white dark:bg-[#111C3A] rounded-[2.5rem] border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-sm overflow-hidden transition-colors duration-500 print:border-none print:rounded-none print:shadow-none">
          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F0F4F8] dark:bg-[#0A122A] border-b border-[#D0DCE8] dark:border-[#1A2A4A] text-[#5A6E8A] dark:text-[#8A9CBA] text-[10px] font-black uppercase tracking-widest">
                  <th className="px-8 py-6">No.</th>
                  <th className="px-8 py-6">Date & Time</th>
                  <th className="px-8 py-6">Patient</th>
                  <th className="px-8 py-6">Assigned Doctor</th>
                  <th className="px-8 py-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F4F8] dark:divide-[#0A122A] print:divide-slate-200">
                {loading ? (
                  <tr><td colSpan={5} className="px-8 py-20 text-center">
                    <Loader2 size={32} className="mx-auto text-[#1E4A8A] animate-spin mb-3" />
                    <p className="text-[#5A6E8A] font-medium">Loading appointments...</p>
                  </td></tr>
                ) : appointments.length === 0 ? (
                  <tr><td colSpan={5} className="px-8 py-20 text-center">
                    <CalendarDays size={48} className="mx-auto text-[#D0DCE8] dark:text-[#1A2A4A] mb-4" />
                    <p className="text-[#5A6E8A] font-bold">No appointments found for the selected filters.</p>
                    {activeFilterCount > 0 && <button onClick={clearFilters} className="mt-3 text-[#1E4A8A] text-sm font-bold hover:underline">Clear filters</button>}
                  </td></tr>
                ) : (
                  appointments.map((appt, idx) => (
                    <tr key={appt.id} className="hover:bg-[#F0F4F8]/50 dark:hover:bg-[#0A122A]/50 transition-colors group print:hover:bg-transparent">
                      <td className="px-8 py-6 text-[#5A6E8A] font-bold text-sm">{idx + 1}</td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex flex-col items-center justify-center text-[#1E4A8A] dark:text-[#4A8AC8] font-bold group-hover:bg-[#1E4A8A] group-hover:text-white transition-all print:hidden">
                            <span className="text-[10px] uppercase leading-none">{format(new Date(appt.dateTime), "MMM")}</span>
                            <span className="text-lg leading-none">{format(new Date(appt.dateTime), "dd")}</span>
                          </div>
                          <div>
                            <p className="font-bold text-[#1A2A4A] dark:text-[#E8EEF8]">{format(new Date(appt.dateTime), "h:mm a")}</p>
                            <p className="text-xs text-[#5A6E8A] dark:text-[#8A9CBA]">{format(new Date(appt.dateTime), "MMM dd, yyyy")}</p>
                            <p className="text-[10px] text-[#5A6E8A] font-mono">ID: {appt.id.slice(-6).toUpperCase()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#F0F4F8] dark:bg-[#0A122A] flex items-center justify-center text-[#5A6E8A] print:hidden"><User size={14} /></div>
                          <div>
                            <p className="font-bold text-[#1A2A4A] dark:text-[#E8EEF8]">{appt.patient?.user?.name}</p>
                            {appt.patient?.cardNumber && <p className="text-[10px] font-mono text-[#5A6E8A]">{appt.patient.cardNumber}</p>}
                            <div className="flex gap-1.5 mt-1 flex-wrap">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${TYPE_COLORS[appt.appointmentType] || TYPE_COLORS.NEW_VISIT}`}>{TYPE_LABELS[appt.appointmentType] || appt.appointmentType}</span>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${PRIORITY_COLORS[appt.priority] || PRIORITY_COLORS.NORMAL}`}>{PRIORITY_LABELS[appt.priority] || appt.priority}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-[#1E4A8A] print:hidden"><Stethoscope size={14} /></div>
                          <div>
                            <p className="font-bold text-[#1A2A4A] dark:text-[#E8EEF8]">Dr. {appt.doctor?.user?.name}</p>
                            <p className="text-[10px] text-[#1E4A8A] dark:text-[#4A8AC8] font-bold uppercase tracking-wider">{appt.doctor?.specialization}</p>
                            {appt.doctor?.department?.name && <p className="text-[10px] text-[#5A6E8A]">{appt.doctor.department.name}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${STATUS_COLORS[appt.status] || STATUS_COLORS.SCHEDULED}`}>
                          {STATUS_LABELS[appt.status] || appt.status}
                        </span>
                        {appt.queueNumber && <p className="text-[10px] text-emerald-600 font-bold mt-1">Queue #{appt.queueNumber}</p>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Print footer */}
          <div className="hidden print:block px-8 py-4 border-t-2 border-slate-200 mt-4">
            <p className="text-sm font-bold text-slate-700">Total Appointments: {appointments.length}</p>
            <p className="text-xs text-slate-500 mt-1">This is a system-generated appointment report. — MediCare Appointment Scheduling System</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
