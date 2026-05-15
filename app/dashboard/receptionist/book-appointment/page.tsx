// app/dashboard/receptionist/book-appointment/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { 
  Search, 
  Calendar, 
  Clock, 
  User, 
  Stethoscope, 
  CheckCircle2, 
  Loader2,
  ArrowRight,
  AlertCircle,
  FileText
} from "lucide-react";
import { PatientSearch, PatientSearchResult } from "@/components/PatientSearch";

import { Suspense } from "react";

interface Doctor {
  id: string;
  specialization: string;
  user: { name: string };
}

function BookingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedPatientId = searchParams.get("patientId");

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  
  const [selectedPatientId, setSelectedPatientId] = useState<string>(preSelectedPatientId || "");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    // Fetch Doctors
    fetch("/api/doctors")
      .then((res) => res.json())
      .then(setDoctors);
  }, []);

  const checkAvailability = async () => {
    if (!selectedDoctor || !date || !time) return;
    
    setCheckingAvailability(true);
    setAvailable(null);
    
    const dateTime = new Date(`${date}T${time}`);
    
    try {
      const res = await fetch(`/api/appointments/check-availability?doctorId=${selectedDoctor}&dateTime=${dateTime.toISOString()}`);
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

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!available || !selectedPatientId) return;

    setLoading(true);
    const dateTime = new Date(`${date}T${time}`);

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: selectedPatientId,
          doctorId: selectedDoctor,
          dateTime: dateTime.toISOString(),
          reason,
        }),
      });

      if (res.ok) {
        toast.success("Appointment booked successfully!");
        router.push("/dashboard/receptionist/schedule");
      } else {
        const error = await res.json();
        toast.error(error.message || "Failed to book appointment");
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout role="receptionist">
      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight text-center">New Appointment</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-center text-lg font-medium italic">Bridge patients with world-class care.</p>
        </div>

        <form onSubmit={handleBooking} className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Step 1: Patient Selection */}
          <div className="space-y-8">
            <Card className="rounded-[2.5rem] border-slate-100 dark:border-slate-800 shadow-sm overflow-visible flex flex-col bg-white dark:bg-[#0F172A] transition-colors duration-500">
              <CardHeader className="bg-teal-900 dark:bg-teal-950 text-white p-8 rounded-t-[2.5rem]">
                <CardTitle className="flex items-center gap-3">
                  <User size={24} className="text-teal-400" />
                  Select Patient
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 flex-1 space-y-6">
                <PatientSearch 
                  onSelect={(p) => {
                    setSelectedPatientId(p.id);
                  }}
                  selectedPatientId={selectedPatientId}
                />
              </CardContent>
            </Card>

            <Card className="rounded-[2.5rem] border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col bg-white dark:bg-[#0F172A] transition-colors duration-500">
              <CardHeader className="p-8 pb-0">
                <CardTitle className="text-xl font-black text-teal-900 dark:text-teal-400 flex items-center gap-3">
                  <FileText className="text-teal-600" size={24} />
                  Reason for Visit
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Describe the symptoms or reason for the appointment... (Optional)"
                  className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 border-2 border-transparent rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:border-teal-600 outline-none transition-all font-medium text-slate-900 dark:text-slate-100 min-h-[120px] resize-none"
                />
              </CardContent>
            </Card>
          </div>

          {/* Step 2 & 3: Doctor and Time */}
          <div className="space-y-8">
            <Card className="rounded-[2.5rem] border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden bg-white dark:bg-[#0F172A] transition-colors duration-500">
              <CardHeader className="p-8 pb-0">
                <CardTitle className="text-xl font-black text-teal-900 dark:text-teal-400 flex items-center gap-3">
                  <Stethoscope className="text-teal-600" size={24} />
                  Choose Doctor
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-4">
                <select
                  value={selectedDoctor}
                  onChange={(e) => {
                    setSelectedDoctor(e.target.value);
                    setAvailable(null);
                  }}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 border-2 border-transparent rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:border-teal-600 outline-none transition-all font-bold text-slate-900 dark:text-slate-100 appearance-none"
                  required
                >
                  <option value="">Select a Doctor</option>
                  {doctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      Dr. {doc.user.name} ({doc.specialization})
                    </option>
                  ))}
                </select>
              </CardContent>
            </Card>

            <Card className="rounded-[2.5rem] border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden bg-white dark:bg-[#0F172A] transition-colors duration-500">
              <CardHeader className="p-8 pb-0">
                <CardTitle className="text-xl font-black text-teal-900 dark:text-teal-400 flex items-center gap-3">
                  <Calendar className="text-teal-600" size={24} />
                  Date & Time
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Date</label>
                    <input
                      type="date"
                      value={date}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => {
                        setDate(e.target.value);
                        setAvailable(null);
                      }}
                      className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 border-2 border-transparent rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:border-teal-600 outline-none transition-all font-bold text-slate-900 dark:text-slate-100"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Time Slot</label>
                    <select
                      value={time}
                      onChange={(e) => {
                        setTime(e.target.value);
                        setAvailable(null);
                      }}
                      className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 border-2 border-transparent rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:border-teal-600 outline-none transition-all font-bold text-slate-900 dark:text-slate-100 appearance-none"
                      required
                    >
                      <option value="">Select time</option>
                      {/* Fixed working hours slots */}
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
                  disabled={!selectedDoctor || !date || !time || checkingAvailability}
                  className="w-full py-4 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 rounded-2xl font-black hover:bg-teal-100 dark:hover:bg-teal-900/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {checkingAvailability ? <Loader2 className="animate-spin" /> : <Clock size={20} />}
                  Check Slot Availability
                </button>

                {available === true && (
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-900 flex items-center gap-3 text-emerald-700 dark:text-emerald-400 font-bold">
                    <CheckCircle2 size={24} />
                    Slot is Available
                  </div>
                )}
                {available === false && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-900 flex items-center gap-3 text-red-700 dark:text-red-400 font-bold">
                    <AlertCircle size={24} />
                    Slot is Taken
                  </div>
                )}
              </CardContent>
            </Card>

            <button
              type="submit"
              disabled={!available || loading || !selectedPatientId}
              className="w-full py-6 bg-teal-700 text-white rounded-[2.5rem] font-black text-xl shadow-2xl shadow-teal-900/20 hover:bg-teal-800 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:bg-slate-300 disabled:shadow-none"
            >
              {loading ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
              Confirm Booking
              <ArrowRight size={24} />
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

export default function ReceptionistBookingPage() {
  return (
    <Suspense fallback={
      <DashboardLayout role="receptionist">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="animate-spin text-teal-600" size={48} />
        </div>
      </DashboardLayout>
    }>
      <BookingForm />
    </Suspense>
  );
}
