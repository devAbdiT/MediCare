"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import WeeklyCalendar from "@/components/WeeklyCalendar";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { format, startOfWeek, addDays, subDays } from "date-fns";
import { UserCheck, Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ReceptionistCalendarPage() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState<any[]>([]);
  
  // Filters
  const [filterDoctorId, setFilterDoctorId] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const startOfWeekDate = useMemo(
    () => startOfWeek(currentDate, { weekStartsOn: 1 }),
    // Only recompute when the date changes by at least a day
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentDate.toDateString()]
  );

  // Fetch doctors for filter dropdown
  useEffect(() => {
    fetch("/api/doctors")
      .then((r) => r.json())
      .then((d) => setDoctors(Array.isArray(d) ? d : []))
      .catch(console.error);
  }, []);

  const fetchWeekAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const mondayStr = format(startOfWeekDate, "yyyy-MM-dd");
      const sundayStr = format(addDays(startOfWeekDate, 6), "yyyy-MM-dd");
      
      const res = await fetch(`/api/appointments?startDate=${mondayStr}&endDate=${sundayStr}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [startOfWeekDate]);

  useEffect(() => {
    fetchWeekAppointments();
  }, [fetchWeekAppointments]);

  // In-memory filtration
  const filteredAppointments = appointments.filter((appt) => {
    if (filterDoctorId !== "all" && appt.doctorId !== filterDoctorId) return false;
    
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const patientName = appt.patient?.user?.name?.toLowerCase() || "";
      const docName = appt.doctor?.user?.name?.toLowerCase() || "";
      if (!patientName.includes(q) && !docName.includes(q)) return false;
    }
    return true;
  });

  return (
    <DashboardLayout role="receptionist">
      <div className="space-y-8 max-w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-[#1A2A4A] dark:text-[#E8EEF8] tracking-tight">Master Calendar</h1>
            <p className="text-[#5A6E8A] dark:text-[#8A9CBA] font-medium mt-1">
              Weekly view of all clinic appointments.
            </p>
          </div>
          
          {/* Filters */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search patient/doctor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2.5 bg-white dark:bg-[#111C3A] border border-[#D0DCE8] dark:border-[#1A2A4A] rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#7C3AED] outline-none w-64 text-[#1A2A4A] dark:text-[#E8EEF8]"
              />
            </div>
            
            <div className="relative">
              <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <select
                value={filterDoctorId}
                onChange={(e) => setFilterDoctorId(e.target.value)}
                className="pl-9 pr-8 py-2.5 bg-white dark:bg-[#111C3A] border border-[#D0DCE8] dark:border-[#1A2A4A] rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#7C3AED] outline-none appearance-none cursor-pointer text-[#1A2A4A] dark:text-[#E8EEF8]"
              >
                <option value="all">All Doctors</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    Dr. {d.user.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-[#5A6E8A] gap-3">
            <Loader2 className="animate-spin" size={24} />
            <span className="font-bold">Loading calendar...</span>
          </div>
        ) : (
          <WeeklyCalendar
            appointments={filteredAppointments}
            role="RECEPTIONIST"
            currentWeekStart={currentDate}
            onPrevWeek={() => setCurrentDate(prev => subDays(prev, 7))}
            onNextWeek={() => setCurrentDate(prev => addDays(prev, 7))}
            onToday={() => setCurrentDate(new Date())}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
