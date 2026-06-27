"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { format, differenceInMinutes, parseISO } from "date-fns";
import { Clock, Activity, CheckCircle2, UserX, User, Loader2, Phone, Hash } from "lucide-react";
import { cn } from "@/lib/utils";

export default function QueueBoardPage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchQueue = useCallback(async () => {
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const res = await fetch(`/api/appointments?date=${todayStr}&status=CHECKED_IN`);
      if (res.ok) {
        const data = await res.json();
        // Sort by checkedInAt (if exists) or just queueNumber
        const sorted = data.sort((a: any, b: any) => {
          if (a.checkedInAt && b.checkedInAt) {
            return new Date(a.checkedInAt).getTime() - new Date(b.checkedInAt).getTime();
          }
          return (a.queueNumber || 0) - (b.queueNumber || 0);
        });
        setAppointments(sorted);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-refresh every 60s
  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 60000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  // Actions
  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) fetchQueue();
    } catch (err) {
      console.error(err);
    }
  };

  const getWaitInfo = (checkedInAt?: string) => {
    if (!checkedInAt) return { text: "Unknown", mins: 0, color: "text-slate-500" };
    const mins = differenceInMinutes(currentTime, parseISO(checkedInAt));
    let color = "text-emerald-600 dark:text-emerald-400 font-bold";
    if (mins >= 15 && mins < 30) color = "text-amber-600 dark:text-amber-400 font-black";
    if (mins >= 30) color = "text-rose-600 dark:text-rose-400 font-black";

    const hours = Math.floor(mins / 60);
    const m = mins % 60;
    const text = hours > 0 ? `${hours} hr ${m} min` : `${m} min`;
    return { text, mins, color };
  };

  const waitTimes = appointments.map((a) => getWaitInfo(a.checkedInAt).mins).filter(m => m > 0);
  const avgWait = waitTimes.length ? Math.round(waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length) : 0;
  const longestWait = waitTimes.length ? Math.max(...waitTimes) : 0;

  return (
    <DashboardLayout role="receptionist">
      <div className="space-y-8 max-w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#1A2A4A] dark:text-[#E8EEF8] tracking-tight">Queue Board</h1>
          <p className="text-[#5A6E8A] dark:text-[#8A9CBA] font-medium mt-1">
            Live waiting room management.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white dark:bg-[#111C3A] border border-[#D0DCE8] dark:border-[#1A2A4A] px-4 py-2.5 rounded-2xl shadow-sm">
            <Clock className="text-[#7C3AED]" size={20} />
            <span className="text-xl font-black text-[#1A2A4A] dark:text-[#E8EEF8] tracking-tighter tabular-nums">
              {format(currentTime, "HH:mm:ss")}
            </span>
          </div>
          <button
            onClick={fetchQueue}
            className="p-2.5 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors border border-slate-200 dark:border-slate-800 text-slate-600"
            title="Refresh manually"
          >
            <Activity size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white dark:bg-[#111C3A] rounded-3xl border border-[#D0DCE8] dark:border-[#1A2A4A] p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center">
            <User size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#5A6E8A] dark:text-[#8A9CBA]">Waiting Now</p>
            <p className="text-3xl font-black text-[#1A2A4A] dark:text-[#E8EEF8]">{appointments.length}</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-[#111C3A] rounded-3xl border border-[#D0DCE8] dark:border-[#1A2A4A] p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#5A6E8A] dark:text-[#8A9CBA]">Avg Wait Time</p>
            <p className="text-3xl font-black text-[#1A2A4A] dark:text-[#E8EEF8]">{avgWait} <span className="text-sm">min</span></p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-[#111C3A] rounded-3xl border border-[#D0DCE8] dark:border-[#1A2A4A] p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#5A6E8A] dark:text-[#8A9CBA]">Longest Wait</p>
            <p className="text-3xl font-black text-[#1A2A4A] dark:text-[#E8EEF8]">{longestWait} <span className="text-sm">min</span></p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#111C3A] rounded-[2rem] border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#F8FAFC] dark:bg-[#0A122A] border-b border-[#D0DCE8] dark:border-[#1A2A4A] text-[10px] uppercase font-black text-[#5A6E8A] dark:text-[#8A9CBA] tracking-widest">
              <tr>
                <th className="px-6 py-4">Q#</th>
                <th className="px-6 py-4">Patient Name</th>
                <th className="px-6 py-4">Doctor</th>
                <th className="px-6 py-4 text-center">Priority</th>
                <th className="px-6 py-4 text-right">Wait Time</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D0DCE8] dark:divide-[#1A2A4A]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-[#5A6E8A]">
                    <div className="flex justify-center items-center gap-3">
                      <Loader2 className="animate-spin" size={24} />
                      <span className="font-bold">Loading queue...</span>
                    </div>
                  </td>
                </tr>
              ) : appointments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-[#5A6E8A]">
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle2 size={32} className="text-emerald-400" />
                      <span className="font-bold">Queue is empty</span>
                    </div>
                  </td>
                </tr>
              ) : (
                appointments.map((appt) => {
                  const wait = getWaitInfo(appt.checkedInAt);
                  const isEmergency = appt.priority === "EMERGENCY";

                  return (
                    <tr key={appt.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="inline-flex items-center justify-center min-w-[32px] h-8 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-black text-xs border border-emerald-200 dark:border-emerald-800">
                          {appt.queueNumber || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-[#1A2A4A] dark:text-[#E8EEF8]">{appt.patient?.user?.name}</p>
                        <p className="text-xs text-[#5A6E8A]">{appt.patient?.cardNumber}</p>
                      </td>
                      <td className="px-6 py-4 text-[#5A6E8A] dark:text-[#8A9CBA] font-medium">
                        Dr. {appt.doctor?.user?.name}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                          isEmergency 
                            ? "bg-rose-100 text-rose-700 border-rose-200 animate-pulse" 
                            : appt.priority === "URGENT"
                            ? "bg-amber-100 text-amber-700 border-amber-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        )}>
                          {appt.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={wait.color}>{wait.text}</span>
                        <div className="text-[10px] text-[#5A6E8A] mt-0.5 font-medium">
                          Checked in {appt.checkedInAt ? format(new Date(appt.checkedInAt), "HH:mm") : "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {}}
                            className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                            title="Call Patient (Visual Only)"
                          >
                            <Phone size={16} />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm("Complete appointment?")) updateStatus(appt.id, "COMPLETED");
                            }}
                            className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                            title="Complete"
                          >
                            <CheckCircle2 size={16} />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm("Mark as No Show?")) updateStatus(appt.id, "NO_SHOW");
                            }}
                            className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
                            title="No Show"
                          >
                            <UserX size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </DashboardLayout>
  );
}
