"use client";

import React, { useEffect, useState } from "react";
import {
  format,
  startOfWeek,
  addDays,
  isSameDay,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
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

interface WeeklyCalendarProps {
  appointments: any[];
  role: string;
  currentWeekStart: Date;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  onAppointmentClick?: (appt: any) => void;
}

export default function WeeklyCalendar({
  appointments,
  role,
  currentWeekStart,
  onPrevWeek,
  onNextWeek,
  onToday,
  onAppointmentClick,
}: WeeklyCalendarProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time line every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const startOfWeekDate = startOfWeek(currentWeekStart, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startOfWeekDate, i));

  // 08:00 to 18:00 every 30 mins = 20 intervals starting from 8, ending at 17.5
  const intervals = Array.from({ length: 20 }, (_, i) => 8 + i * 0.5);

  const formatTimeLabel = (val: number) => {
    const hour = Math.floor(val);
    const min = val % 1 === 0 ? "00" : "30";
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    const ampm = hour >= 12 ? "PM" : "AM";
    return `${displayHour}:${min} ${ampm}`;
  };

  const formatWeekRange = (start: Date, end: Date) => {
    return `${format(start, "MMMM d")} – ${format(end, "MMMM d, yyyy")}`;
  };

  // Helper to fetch cell appointments (exact 30 min block)
  const getAppointmentsForCell = (day: Date, val: number) => {
    return appointments.filter((appt) => {
      const apptDate = new Date(appt.dateTime);
      const apptVal = apptDate.getHours() + apptDate.getMinutes() / 60;
      // We place the appt in the slot if it falls into this 30 min window
      // For instance, 9:15 goes into the 9.0 block. 9:45 goes into 9.5.
      return isSameDay(apptDate, day) && apptVal >= val && apptVal < val + 0.5;
    });
  };

  // Colors based on AppointmentType
  const getCardStyles = (type: string, priority: string) => {
    let bgClass = "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700";
    
    if (type === "NEW_VISIT") {
      bgClass = "bg-blue-50/90 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800";
    } else if (type === "FOLLOW_UP") {
      bgClass = "bg-emerald-50/90 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
    } else if (type === "CONSULTATION") {
      bgClass = "bg-purple-50/90 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800";
    } else if (type === "EMERGENCY") {
      bgClass = "bg-rose-50/90 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800";
    }

    let borderClass = "";
    if (priority === "EMERGENCY" || type === "EMERGENCY") {
      borderClass = "border-l-4 border-l-rose-500 animate-pulse font-black";
    }

    return { bgClass, borderClass };
  };

  // Current time position relative to grid
  const currentHour = currentTime.getHours();
  const currentMin = currentTime.getMinutes();
  const currentVal = currentHour + currentMin / 60;
  const isTimeInGrid = currentVal >= 8 && currentVal < 18;

  return (
    <div className="space-y-6">
      {/* Calendar Header with Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-[#0F172A] p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm print:hidden">
        <div className="flex items-center gap-2">
          <button
            onClick={onPrevWeek}
            className="p-2.5 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl border border-slate-200 dark:border-slate-700 transition-colors"
            title="Previous Week"
          >
            <ChevronLeft size={20} />
          </button>
          
          <button
            onClick={onToday}
            className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm font-bold rounded-2xl border border-slate-200 dark:border-slate-700 transition-colors"
          >
            Today
          </button>

          <button
            onClick={onNextWeek}
            className="p-2.5 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl border border-slate-200 dark:border-slate-700 transition-colors"
            title="Next Week"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <CalendarIcon className="text-[#7C3AED]" size={18} />
          <span className="text-base font-black text-slate-800 dark:text-slate-200 tracking-tight">
            {formatWeekRange(weekDays[0], weekDays[6])}
          </span>
        </div>

        <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          {appointments.length} Appointment{appointments.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white dark:bg-[#0F172A] rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors duration-500 relative">
        <div className="overflow-x-auto custom-scrollbar relative">
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
                    "bg-slate-50/50 dark:bg-slate-900/30 border-b border-r border-slate-100 dark:border-slate-800 p-4 text-center flex flex-col items-center justify-center transition-colors duration-500 relative",
                    isTodayDay && "bg-blue-50/50 dark:bg-blue-900/20"
                  )}
                >
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    {format(day, "EEEE")}
                  </span>
                  <span
                    className={cn(
                      "text-lg font-black text-slate-800 dark:text-slate-200 mt-0.5 w-8 h-8 flex items-center justify-center rounded-full",
                      isTodayDay && "bg-blue-600 text-white dark:bg-blue-500"
                    )}
                  >
                    {format(day, "d")}
                  </span>
                </div>
              );
            })}

            {/* Time Rows */}
            {intervals.map((val) => {
              return (
                <React.Fragment key={val}>
                  {/* Time Label */}
                  <div className="border-b border-r border-slate-100 dark:border-slate-800 p-2 text-center flex items-start justify-center bg-slate-50/20 dark:bg-slate-900/10">
                    <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 -mt-1">
                      {formatTimeLabel(val)}
                    </span>
                  </div>

                  {/* Days columns for this interval */}
                  {weekDays.map((day) => {
                    const cellAppts = getAppointmentsForCell(day, val);
                    const isTodayDay = isSameDay(day, new Date());
                    
                    // Check if current time line should be drawn in this cell
                    const isCurrentCell = isTodayDay && isTimeInGrid && currentVal >= val && currentVal < val + 0.5;
                    const timeLineTopPercent = ((currentVal - val) / 0.5) * 100;

                    return (
                      <div
                        key={day.toString() + val}
                        className={cn(
                          "border-b border-r border-slate-100 dark:border-slate-800 p-1.5 min-h-[70px] relative transition-colors duration-500",
                          isTodayDay && "bg-blue-50/20 dark:bg-blue-900/5",
                          "hover:bg-slate-50/50 dark:hover:bg-slate-900/30"
                        )}
                      >
                        {isCurrentCell && (
                          <div
                            className="absolute left-0 right-0 z-20 flex items-center pointer-events-none"
                            style={{ top: `${timeLineTopPercent}%` }}
                          >
                            <div className="w-2 h-2 rounded-full bg-red-500 -ml-1"></div>
                            <div className="h-[2px] bg-red-500 w-full opacity-70"></div>
                          </div>
                        )}

                        <div className="flex flex-col gap-1.5 w-full h-full relative z-10">
                          {cellAppts.map((appt) => {
                            const { bgClass, borderClass } = getCardStyles(appt.appointmentType || "", appt.priority);
                            
                            return (
                              <button
                                key={appt.id}
                                onClick={() => onAppointmentClick?.(appt)}
                                className={cn(
                                  "w-full text-left p-1.5 rounded-xl border shadow-sm transition-all duration-300 hover:shadow-md hover:scale-[1.02] flex flex-col gap-0.5 cursor-pointer relative overflow-hidden",
                                  bgClass,
                                  borderClass
                                )}
                              >
                                <div className="flex justify-between items-start gap-1">
                                  <span className="font-bold text-xs truncate">
                                    {appt.patient?.user?.name?.split(" ")[0] || "Unknown"}
                                  </span>
                                  <span className="text-[9px] font-black opacity-80 whitespace-nowrap">
                                    {format(new Date(appt.dateTime), "h:mm a")}
                                  </span>
                                </div>
                                
                                {role === "RECEPTIONIST" && appt.doctor && (
                                  <div className="flex items-center gap-1 text-[9px] opacity-80 font-medium truncate">
                                    <Clock size={8} />
                                    <span className="truncate">Dr. {appt.doctor?.user?.name?.split(" ")[0]}</span>
                                  </div>
                                )}

                                <div className="mt-1">
                                  <span className="inline-block px-1.5 py-0.5 rounded-md bg-white/60 dark:bg-black/20 text-[8px] font-bold tracking-wider uppercase">
                                    {TYPE_LABELS[appt.appointmentType] || appt.appointmentType}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
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
