"use client";

import React from "react";
import { format } from "date-fns";
import { ArrowRight, Hash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

interface DoctorActiveScheduleProps {
  initialAppointments: any[];
}

export default function DoctorActiveSchedule({ initialAppointments }: DoctorActiveScheduleProps) {
  const router = useRouter();

  return (
    <div className="lg:col-span-3 bg-[#F0F4F8] dark:bg-[#0A122A] p-10 rounded-[3rem] border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-sm relative overflow-hidden transition-colors duration-500">
      
      {/* Header and Switcher Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
        <div>
          <h2 className="text-2xl font-black text-[#1A2A4A] dark:text-[#E8EEF8] tracking-tight">Active Schedule</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2 h-2 bg-[#1E4A8A] dark:bg-[#4A8AC8] rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-widest">Real-time sync</span>
          </div>
        </div>

      </div>

      <div className="space-y-4">
          {initialAppointments.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-[#111C3A] rounded-[2rem] border-2 border-dashed border-[#D0DCE8] dark:border-[#1A2A4A]">
              <p className="text-[#5A6E8A] dark:text-[#8A9CBA] font-bold italic">No upcoming patients queued.</p>
            </div>
          ) : (
            initialAppointments.map((appt) => (
              <div
                key={appt.id}
                className="group flex items-center gap-8 p-6 rounded-[2.5rem] bg-white dark:bg-[#111C3A] border border-[#D0DCE8] dark:border-[#1A2A4A] hover:border-[#1E4A8A] dark:hover:border-[#4A8AC8] hover:shadow-2xl hover:shadow-blue-500/5 transition-all duration-500"
              >
                <div className="text-center min-w-[80px]">
                  <p className="text-[10px] font-black text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-widest">
                    {format(new Date(appt.dateTime), "MMM dd")}
                  </p>
                  <p className="text-2xl font-black text-[#1A2A4A] dark:text-[#E8EEF8] leading-none my-1">
                    {format(new Date(appt.dateTime), "HH:mm")}
                  </p>
                </div>
                
                <div className="w-1.5 h-12 bg-[#F0F4F8] dark:bg-[#0A122A] rounded-full group-hover:bg-[#1E4A8A] dark:group-hover:bg-[#4A8AC8] transition-colors" />
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[10px] font-black text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-widest">
                      Patient Encounter
                    </p>
                    {appt.queueNumber && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-[10px] font-black text-emerald-700 dark:text-emerald-400">
                        <Hash size={10} />Q{appt.queueNumber}
                      </span>
                    )}
                  </div>
                  <h4 className="text-xl font-black text-[#1A2A4A] dark:text-[#E8EEF8]">
                    {appt.patient.user.name}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span
                      className={cn(
                        "text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border",
                        (appt.appointmentType || "NEW_VISIT") === "NEW_VISIT" &&
                          "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900",
                        (appt.appointmentType || "NEW_VISIT") === "FOLLOW_UP" &&
                          "bg-teal-50 text-teal-700 border-teal-100 dark:bg-teal-900/20 dark:text-teal-400 dark:border-teal-900",
                        (appt.appointmentType || "NEW_VISIT") === "CONSULTATION" &&
                          "bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-900",
                        (appt.appointmentType || "NEW_VISIT") === "EMERGENCY" &&
                          "bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900"
                      )}
                    >
                      {(appt.appointmentType || "NEW_VISIT").replace("_", " ")}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg",
                        (appt.priority || "NORMAL") === "NORMAL" &&
                          "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
                        (appt.priority || "NORMAL") === "URGENT" &&
                          "bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
                        (appt.priority || "NORMAL") === "EMERGENCY" &&
                          "bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800 animate-pulse font-black"
                      )}
                    >
                      {appt.priority || "NORMAL"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Badge
                    className={cn(
                      "rounded-full px-4 py-1.5 font-black text-[10px] uppercase tracking-widest border-none shadow-sm",
                      appt.status === "SCHEDULED"
                        ? "bg-[#1E4A8A]/10 dark:bg-[#4A8AC8]/10 text-[#1E4A8A] dark:text-[#4A8AC8]"
                        : appt.status === "CHECKED_IN"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : appt.status === "NO_SHOW"
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        : "bg-emerald-500/10 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    )}
                  >
                    {appt.status === "CHECKED_IN"
                      ? "Checked In"
                      : appt.status === "NO_SHOW"
                      ? "No-Show"
                      : appt.status}
                  </Badge>
                  <Link href={`/dashboard/doctor/appointments/${appt.id}`}>
                    <button className="p-4 bg-[#1A2A4A] dark:bg-[#111C3A] text-white rounded-[1.5rem] hover:bg-[#1E4A8A] dark:hover:bg-[#4A8AC8] hover:text-white dark:hover:text-[#0A122A] border border-[#D0DCE8] dark:border-[#1A2A4A] transition-all shadow-xl shadow-slate-200 dark:shadow-none cursor-pointer">
                      <ArrowRight size={20} />
                    </button>
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
    </div>
  );
}
