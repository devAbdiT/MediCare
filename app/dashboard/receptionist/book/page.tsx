// app/dashboard/receptionist/book/page.tsx
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
  AlertCircle
} from "lucide-react";

interface Doctor {
  id: string;
  specialization: string;
  user: { name: string };
}

interface Patient {
  id: string;
  user: { name: string; email: string };
}

export default function ReceptionistBookingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedPatientId = searchParams.get("patientId");

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [selectedPatient, setSelectedPatient] = useState<string>(preSelectedPatientId || "");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    // Fetch Doctors
    fetch("/api/doctors")
      .then((res) => res.json())
      .then(setDoctors);

    // Fetch Patients for selection
    fetch("/api/patients")
      .then((res) => res.json())
      .then(setPatients);
  }, []);

  const filteredPatients = patients.filter(p => 
    p.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    if (!available || !selectedPatient) return;

    setLoading(true);
    const dateTime = new Date(`${date}T${time}`);

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: selectedPatient,
          doctorId: selectedDoctor,
          dateTime: dateTime.toISOString(),
        }),
      });

      if (res.ok) {
        toast.success("Appointment booked successfully!");
        router.push("/dashboard/receptionist");
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
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight text-center">New Appointment</h1>
          <p className="text-slate-500 mt-2 text-center text-lg font-medium italic">Bridge patients with world-class care.</p>
        </div>

        <form onSubmit={handleBooking} className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Step 1: Patient Selection */}
          <Card className="rounded-[2.5rem] border-slate-100 shadow-sm overflow-hidden flex flex-col">
            <CardHeader className="bg-slate-900 text-white p-8">
              <CardTitle className="flex items-center gap-3">
                <User size={24} className="text-blue-400" />
                Select Patient
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 flex-1 space-y-6">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                <input
                  type="text"
                  placeholder="Search patient name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-600 outline-none transition-all font-medium text-slate-900"
                />
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredPatients.map((p) => (
                  <label key={p.id} className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer ${selectedPatient === p.id ? "bg-blue-50 border-blue-600" : "bg-white border-slate-50 hover:border-blue-100"}`}>
                    <input 
                      type="radio" 
                      name="patient" 
                      value={p.id} 
                      checked={selectedPatient === p.id}
                      onChange={() => setSelectedPatient(p.id)}
                      className="hidden" 
                    />
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${selectedPatient === p.id ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"}`}>
                      {p.user.name[0]}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{p.user.name}</p>
                      <p className="text-xs text-slate-400 font-medium">{p.user.email}</p>
                    </div>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Step 2 & 3: Doctor and Time */}
          <div className="space-y-8">
            <Card className="rounded-[2.5rem] border-slate-100 shadow-sm overflow-hidden">
              <CardHeader className="p-8 pb-0">
                <CardTitle className="text-xl font-black text-slate-800 flex items-center gap-3">
                  <Stethoscope className="text-blue-600" size={24} />
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
                  className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-600 outline-none transition-all font-bold text-slate-900 appearance-none"
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

            <Card className="rounded-[2.5rem] border-slate-100 shadow-sm overflow-hidden">
              <CardHeader className="p-8 pb-0">
                <CardTitle className="text-xl font-black text-slate-800 flex items-center gap-3">
                  <Calendar className="text-blue-600" size={24} />
                  Date & Time
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Date</label>
                    <input
                      type="date"
                      value={date}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => {
                        setDate(e.target.value);
                        setAvailable(null);
                      }}
                      className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-600 outline-none transition-all font-bold text-slate-900"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Time Slot</label>
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => {
                        setTime(e.target.value);
                        setAvailable(null);
                      }}
                      className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-600 outline-none transition-all font-bold text-slate-900"
                      required
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={checkAvailability}
                  disabled={!selectedDoctor || !date || !time || checkingAvailability}
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
                {available === false && (
                  <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-3 text-red-700 font-bold">
                    <AlertCircle size={24} />
                    Slot is Taken
                  </div>
                )}
              </CardContent>
            </Card>

            <button
              type="submit"
              disabled={!available || loading || !selectedPatient}
              className="w-full py-6 bg-slate-900 text-white rounded-[2.5rem] font-black text-xl shadow-2xl shadow-slate-200 hover:bg-slate-800 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:bg-slate-300"
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
