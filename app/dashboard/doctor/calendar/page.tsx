"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import WeeklyCalendar from "@/components/WeeklyCalendar";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { format, startOfWeek, addDays, subDays } from "date-fns";
import { Loader2 } from "lucide-react";

export default function DoctorCalendarPage() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const startOfWeekDate = useMemo(
    () => startOfWeek(currentDate, { weekStartsOn: 1 }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentDate.toDateString()]
  );

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

  return (
    <DashboardLayout role="doctor">
      <div className="space-y-8 max-w-full">
        <div>
          <h1 className="text-3xl font-black text-[#1A2A4A] dark:text-[#E8EEF8] tracking-tight">My Calendar</h1>
          <p className="text-[#5A6E8A] dark:text-[#8A9CBA] font-medium mt-1">
            Weekly view of your scheduled appointments.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-[#5A6E8A] gap-3">
            <Loader2 className="animate-spin" size={24} />
            <span className="font-bold">Loading calendar...</span>
          </div>
        ) : (
          <WeeklyCalendar
            appointments={appointments}
            role="DOCTOR"
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
