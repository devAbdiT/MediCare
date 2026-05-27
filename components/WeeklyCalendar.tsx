"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  format,
  startOfWeek,
  addDays,
  subDays,
  isSameDay,
  parseISO,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Hash,
  Activity,
  Loader2,
  Calendar as CalendarIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Label maps
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

interface WeeklyCalendarProps {
  onAppointmentClick?: (appt: any) => void;
  // Filters to apply in-memory
  searchQuery?: string;
  filterStatus?: string;
  filterDoctorId?: string;
  filterDepartmentId?: string;
  filterType?: string;
  filterPriority?: string;
}

export default function WeeklyCalendar({
  onAppointmentClick,
  searchQuery = "",
  filterStatus = "all",
  filterDoctorId = "all",
  filterDepartmentId = "all",
  filterType = "all",
  filterPriority = "all",
}: WeeklyCalendarProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Get Monday of the selected week
  const startOfWeekDate = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startOfWeekDate, i));

  const fetchWeekAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const mondayStr = format(weekDays[0], "yyyy-MM-dd");
      const sundayStr = format(weekDays[6], "yyyy-MM-dd");
      
      const res = await fetch(`/api/appointments?startDate=${mondayStr}&endDate=${sundayStr}`);
      if (!res.ok) throw new Error("Failed to fetch appointments");
      const data = await res.json();
      setAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    fetchWeekAppointments();
  }, [fetchWeekAppointments]);

  // Week range label formatting
  const formatWeekRange = (start: Date, end: Date) => {
    return `${format(start, "MMMM d")} – ${format(end, "MMMM d, yyyy")}`;
  };

  const handlePrevWeek = () => {
    setCurrentDate((prev) => subDays(prev, 7));
  };

  const handleNextWeek = () => {
    setCurrentDate((prev) => addDays(prev, 7));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Hours: 8 AM to 6 PM (8 to 18)
  const hours = Array.from({ length: 11 }, (_, i) => i + 8);

  const formatHourLabel = (h: number) => {
    const ampm = h >= 12 ? "PM" : "AM";
    const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${displayHour}:00 ${ampm}`;
  };

  // In-memory filtration
  const filteredAppointments = appointments.filter((appt) => {
    if (searchQuery && searchQuery.trim() !== "") {
      const q = searchQuery.trim().toLowerCase();
      const patientName = appt.patient?.user?.name?.toLowerCase() || "";
      const cardNumber = appt.patient?.cardNumber?.toLowerCase() || "";
      const doctorName = appt.doctor?.user?.name?.toLowerCase() || "";
      const phone = appt.patient?.user?.phone?.toLowerCase() || "";
      if (
        !patientName.includes(q) &&
        !cardNumber.includes(q) &&
        !doctorName.includes(q) &&
        !phone.includes(q)
      ) {
        return false;
      }
    }
    if (filterDoctorId && filterDoctorId !== "all") {
      if (appt.doctorId !== filterDoctorId) return false;
    }
    if (filterDepartmentId && filterDepartmentId !== "all") {
      if (appt.doctor?.departmentId !== filterDepartmentId) return false;
    }
    if (filterStatus && filterStatus !== "all") {
      if (appt.status !== filterStatus) return false;
    }
    if (filterType && filterType !== "all") {
      if (appt.appointmentType !== filterType) return false;
    }
    if (filterPriority && filterPriority !== "all") {
      if (appt.priority !== filterPriority) return false;
    }
    return true;
  });

  // Helper to fetch cell appointments
  const getAppointmentsForCell = (day: Date, hour: number) => {
    return filteredAppointments.filter((appt) => {
      const apptDate = new Date(appt.dateTime);
      return isSameDay(apptDate, day) && apptDate.getHours() === hour;
    });
  };

  // Colors based on status & priority
  const getCardStyles = (status: string, priority: string) => {
    let bgClass = "bg-blue-50/90 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900";
    
    if (status === "CHECKED_IN") {
      bgClass = "bg-emerald-50/90 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900";
    } else if (status === "COMPLETED") {
      bgClass = "bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700";
    } else if (status === "CANCELLED") {
      bgClass = "bg-red-50/60 dark:bg-red-950/15 text-red-600/70 dark:text-red-400/70 border-red-150 dark:border-red-950/30 line-through";
    } else if (status === "NO_SHOW") {
      bgClass = "bg-amber-50/90 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900";
    } else if (status === "RESCHEDULED") {
      bgClass = "bg-indigo-50/90 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900";
    }

    let borderClass = "";
    if (priority === "EMERGENCY") {
      borderClass = "border-l-4 border-l-rose-500 dark:border-l-rose-400 animate-pulse font-semibold";
    } else if (priority === "URGENT") {
      borderClass = "border-l-4 border-l-amber-500 dark:border-l-amber-400";
    }

    return { bgClass, borderClass };
  };

  return (
    <div className="space-y-6">
      {/* Calendar Header with Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-[#0F172A] p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm print:hidden">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevWeek}
            className="p-2.5 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl border border-slate-200 dark:border-slate-700 transition-colors"
            title="Previous Week"
          >
            <ChevronLeft size={20} />
          </button>
          
          <button
            onClick={handleToday}
            className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm font-bold rounded-2xl border border-slate-200 dark:border-slate-700 transition-colors"
          >
            Today
          </button>

          <button
            onClick={handleNextWeek}
            className="p-2.5 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl border border-slate-200 dark:border-slate-700 transition-colors"
            title="Next Week"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <CalendarIcon className="text-blue-500" size={18} />
          <span className="text-base font-black text-slate-800 dark:text-slate-200 tracking-tight">
            {formatWeekRange(weekDays[0], weekDays[6])}
          </span>
        </div>

        <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          {loading ? (
            <span className="flex items-center gap-1.5">
              <Loader2 className="animate-spin" size={14} /> Loading Week...
            </span>
          ) : (
            `${filteredAppointments.length} matching appointment${filteredAppointments.length !== 1 ? "s" : ""}`
          )}
        </div>
      </div>

      {/* Calendar Grid Container (Responsive Horizonal Scroll) */}
      <div className="bg-white dark:bg-[#0F172A] rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors duration-500">
        <div className="overflow-x-auto custom-scrollbar">
          <div className="min-w-[980px] grid grid-cols-[80px_repeat(7,1fr)] border-collapse">
            
            {/* Headers */}
            <div className="bg-slate-50/50 dark:bg-slate-900/30 border-b border-r border-slate-100 dark:border-slate-800 p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center">
              Time
            </div>
            {weekDays.map((day) => {
              const isTodayDay = isSameDay(day, new Date());
              return (
                <div
                  key={day.toString()}
                  className={cn(
                    "bg-slate-50/50 dark:bg-slate-900/30 border-b border-r border-slate-100 dark:border-slate-800 p-4 text-center flex flex-col items-center justify-center transition-colors duration-500",
                    isTodayDay && "bg-blue-50/20 dark:bg-blue-900/10"
                  )}
                >
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    {format(day, "EEEE")}
                  </span>
                  <span
                    className={cn(
                      "text-lg font-black text-slate-800 dark:text-slate-200 mt-0.5 w-8 h-8 flex items-center justify-center rounded-full",
                      isTodayDay && "bg-blue-600 text-white dark:bg-blue-500 dark:text-white"
                    )}
                  >
                    {format(day, "d")}
                  </span>
                </div>
              );
            })}

            {/* Time Rows */}
            {hours.map((hour) => {
              return (
                <React.Fragment key={hour}>
                  {/* Time Label */}
                  <div className="border-b border-r border-slate-100 dark:border-slate-800 p-3 text-center flex items-center justify-center bg-slate-50/20 dark:bg-slate-900/10">
                    <span className="text-[10px] font-black text-slate-500 dark:text-slate-400">
                      {formatHourLabel(hour)}
                    </span>
                  </div>

                  {/* Days columns for this hour */}
                  {weekDays.map((day) => {
                    const cellAppts = getAppointmentsForCell(day, hour);
                    const isTodayDay = isSameDay(day, new Date());
                    
                    return (
                      <div
                        key={day.toString() + hour}
                        className={cn(
                          "border-b border-r border-slate-100 dark:border-slate-800 p-2 min-h-[110px] flex flex-col gap-2 transition-colors duration-500",
                          isTodayDay && "bg-blue-50/5 dark:bg-blue-900/5",
                          "hover:bg-slate-50/30 dark:hover:bg-slate-900/20"
                        )}
                      >
                        {cellAppts.map((appt) => {
                          const { bgClass, borderClass } = getCardStyles(appt.status, appt.priority);
                          
                          return (
                            <button
                              key={appt.id}
                              onClick={() => onAppointmentClick?.(appt)}
                              className={cn(
                                "w-full text-left p-2 rounded-2xl border text-xs shadow-sm transition-all duration-300 hover:shadow-md hover:scale-[1.02] flex flex-col gap-1 cursor-pointer",
                                bgClass,
                                borderClass
                              )}
                            >
                              <div className="flex justify-between items-start gap-1">
                                <span className="font-black truncate max-w-[100px]" title={appt.patient?.user?.name}>
                                  {appt.patient?.user?.name || "Unknown"}
                                </span>
                                <span className="text-[9px] font-black opacity-80 whitespace-nowrap shrink-0">
                                  {format(new Date(appt.dateTime), "h:mm a")}
                                </span>
                              </div>

                              <div className="flex items-center gap-1 text-[9px] opacity-75 font-medium truncate">
                                <Clock size={8} />
                                <span className="truncate">Dr. {appt.doctor?.user?.name || "Dr. Unknown"}</span>
                              </div>

                              <div className="flex flex-wrap gap-1 mt-1">
                                <span className="px-1.5 py-0.5 rounded-md bg-white/60 dark:bg-black/20 text-[8px] font-bold tracking-wider uppercase">
                                  {STATUS_LABELS[appt.status] || appt.status}
                                </span>
                                {appt.appointmentType && (
                                  <span className="px-1.5 py-0.5 rounded-md bg-white/60 dark:bg-black/20 text-[8px] font-bold tracking-wider uppercase">
                                    {TYPE_LABELS[appt.appointmentType] || appt.appointmentType}
                                  </span>
                                )}
                                {appt.queueNumber && appt.status === "CHECKED_IN" && (
                                  <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[8px] font-black flex items-center gap-0.5 border border-emerald-500/20">
                                    <Hash size={7} />Q{appt.queueNumber}
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
