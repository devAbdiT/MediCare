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
  CalendarDays
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
      const res = await fetch(`/api/appointments/search?q=${encodeURIComponent(q)}`);
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

  const handlePrint = () => {
    window.print();
  };

  const checkAvailability = async () => {
    if (!rescheduleData || !newDate || !newTime) return;
    
    setCheckingAvailability(true);
    setAvailable(null);
    
    const dateTime = new Date(`${newDate}T${newTime}`);
    
    try {
      const res = await fetch(`/api/appointments/check-availability?doctorId=${rescheduleData.doctorId}&dateTime=${dateTime.toISOString()}`);
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
        body: JSON.stringify({ dateTime: dateTime.toISOString(), status: "SCHEDULED" }),
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
    SCHEDULED: "bg-blue-50 text-blue-600 border-blue-200",
    COMPLETED: "bg-emerald-50 text-emerald-600 border-emerald-200",
    CANCELLED: "bg-red-50 text-red-600 border-red-200",
  };

  return (
    <DashboardLayout role="receptionist">
      <div className="max-w-6xl mx-auto space-y-8 pb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">{showAll ? "Master Schedule" : "Today's Schedule"}</h1>
            <p className="text-slate-500 mt-2 text-lg font-medium">{showAll ? "All upcoming appointments" : format(new Date(), "EEEE, MMMM do, yyyy")}</p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowAll(!showAll)}
              className="px-6 py-3 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-2xl font-bold transition-colors print:hidden"
            >
              {showAll ? "View Today Only" : "View All Schedules"}
            </button>
            <button 
              onClick={handlePrint}
              className="px-6 py-3 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-2xl font-bold flex items-center gap-2 transition-colors print:hidden"
            >
              <Printer size={20} />
              Print
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

        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                  <th className="px-8 py-6">Time</th>
                  <th className="px-8 py-6">Patient</th>
                  <th className="px-8 py-6">Doctor</th>
                  <th className="px-8 py-6">Status</th>
                  <th className="px-8 py-6 text-right print:hidden">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {appointments.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center">
                      <CalendarDays size={48} className="mx-auto text-slate-200 mb-4" />
                      <p className="text-slate-500 font-bold">No appointments scheduled.</p>
                    </td>
                  </tr>
                ) : (
                  appointments.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 font-bold text-slate-900">
                          <Clock size={16} className="text-blue-500" />
                          {format(new Date(app.dateTime), "h:mm a")}
                        </div>
                        <div className="text-xs text-slate-400 font-medium mt-1">
                          {format(new Date(app.dateTime), "MMM dd, yyyy")}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
                            {app.patient?.user?.name[0] || "?"}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{app.patient?.user?.name || "Unknown"}</p>
                            <p className="text-xs text-slate-500">{app.patient?.user?.phone || "No phone"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 font-bold text-slate-700">
                          <Stethoscope size={16} className="text-slate-400" />
                          Dr. {app.doctor?.user?.name || "Unknown"}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${statusColors[app.status as keyof typeof statusColors]}`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right print:hidden">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {app.status === "SCHEDULED" && (
                            <>
                              <button 
                                onClick={() => updateStatus(app.id, "COMPLETED")}
                                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors tooltip-trigger"
                                title="Mark Completed"
                              >
                                <CheckCircle2 size={18} />
                              </button>
                              <button 
                                onClick={() => setRescheduleData(app)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors tooltip-trigger"
                                title="Reschedule"
                              >
                                <Calendar size={18} />
                              </button>
                              <button 
                                onClick={() => updateStatus(app.id, "CANCELLED")}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors tooltip-trigger"
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
      <Dialog open={!!rescheduleData} onOpenChange={() => setRescheduleData(null)}>
        <DialogContent className="sm:max-w-md rounded-[2.5rem] p-8 border-slate-100 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-slate-900">Reschedule Appointment</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">New Date</label>
                <input
                  type="date"
                  value={newDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => {
                    setNewDate(e.target.value);
                    setAvailable(null);
                  }}
                  className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-600 outline-none transition-all font-bold text-slate-900"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">New Time</label>
                <select
                  value={newTime}
                  onChange={(e) => {
                    setNewTime(e.target.value);
                    setAvailable(null);
                  }}
                  className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-600 outline-none transition-all font-bold text-slate-900 appearance-none"
                >
                  <option value="">Select time</option>
                  {Array.from({ length: 9 }, (_, i) => i + 9).map(hour => {
                    const formattedHour = hour < 10 ? `0${hour}` : hour;
                    const label = hour > 12 ? `${hour - 12}:00 PM` : hour === 12 ? `12:00 PM` : `${hour}:00 AM`;
                    return (
                      <option key={hour} value={`${formattedHour}:00:00`}>{label}</option>
                    );
                  })}
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={checkAvailability}
              disabled={!newDate || !newTime || checkingAvailability}
              className="w-full py-4 bg-blue-50 text-blue-600 rounded-2xl font-black hover:bg-blue-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {checkingAvailability ? <Loader2 className="animate-spin" /> : <Clock size={20} />}
              Check Slot Availability
            </button>

            {available === true && (
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3 text-emerald-700 font-bold">
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
