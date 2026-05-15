"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
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
  FileText,
  Activity,
  AlertTriangle,
  Lightbulb,
  Check,
  XCircle
} from "lucide-react";
import { PatientSearch } from "@/components/PatientSearch";

import { Suspense } from "react";

interface DoctorWorkload {
  doctorId: string;
  name: string;
  specialization: string;
  appointmentCount: number;
  weeklyCount: number;
  workloadLevel: "LOW" | "MEDIUM" | "HIGH" | "FULL";
  available: boolean;
}

function BookingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedPatientId = searchParams.get("patientId");

  const [doctors, setDoctors] = useState<DoctorWorkload[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  
  const [selectedPatientId, setSelectedPatientId] = useState<string>(preSelectedPatientId || "");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");
  const [showOnlyAlternatives, setShowOnlyAlternatives] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    if (!date) return;
    
    setLoadingDoctors(true);
    fetch(`/api/doctors/workload?date=${date}`)
      .then(res => res.json())
      .then(data => {
        const sorted = data.sort((a: DoctorWorkload, b: DoctorWorkload) => {
          const rank = { LOW: 1, MEDIUM: 2, HIGH: 3, FULL: 4 };
          return rank[a.workloadLevel] - rank[b.workloadLevel];
        });
        setDoctors(sorted);
        if (selectedDoctor && !sorted.find((d: any) => d.doctorId === selectedDoctor)?.available) {
          setSelectedDoctor("");
        }
      })
      .catch(() => toast.error("Failed to load doctors"))
      .finally(() => setLoadingDoctors(false));
  }, [date]);

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

  const getWorkloadColor = (level: string) => {
    switch(level) {
      case "LOW": return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800";
      case "MEDIUM": return "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800";
      case "HIGH": return "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800";
      case "FULL": return "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800";
      default: return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getWorkloadIcon = (level: string) => {
    switch(level) {
      case "LOW": return <Check size={16} className="text-emerald-500" />;
      case "MEDIUM": return <Activity size={16} className="text-yellow-500" />;
      case "HIGH": return <AlertTriangle size={16} className="text-orange-500" />;
      case "FULL": return <AlertTriangle size={16} className="text-red-500" />;
      default: return null;
    }
  };

  const filteredDoctors = showOnlyAlternatives 
    ? doctors.filter(d => d.workloadLevel === "LOW" || d.workloadLevel === "MEDIUM") 
    : doctors;

  return (
    <DashboardLayout role="receptionist">
      <div className="max-w-6xl mx-auto space-y-8 pb-12">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight text-center">New Appointment</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-center text-lg font-medium italic">Bridge patients with world-class care.</p>
        </div>

        <form onSubmit={handleBooking} className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-8">
          {/* Left Column: Patient & Date */}
          <div className="space-y-8">
            <Card className="rounded-[2.5rem] border-slate-100 dark:border-slate-800 shadow-sm overflow-visible flex flex-col bg-white dark:bg-[#0F172A] transition-colors duration-500">
              <CardHeader className="bg-teal-900 dark:bg-teal-950 text-white p-8 rounded-t-[2.5rem]">
                <CardTitle className="flex items-center gap-3">
                  <User size={24} className="text-teal-400" />
                  1. Patient Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <PatientSearch 
                  onSelect={(p) => {
                    setSelectedPatientId(p.id);
                  }}
                  selectedPatientId={selectedPatientId}
                />
                
                <div className="space-y-2 mt-4">
                  <Label className="font-bold text-slate-700 dark:text-slate-300">Appointment Date</Label>
                  <Input 
                    type="date" 
                    value={date}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => {
                      setDate(e.target.value);
                      setAvailable(null);
                      setSelectedDoctor("");
                      setTime("");
                    }}
                    className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 dark:text-slate-100 font-medium" 
                    required 
                  />
                </div>

                <div className="space-y-2 mt-4">
                  <Label className="font-bold text-slate-700 dark:text-slate-300">Reason for Visit</Label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Describe the symptoms or reason for the appointment... (Optional)"
                    className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-200 dark:border-slate-800 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:border-teal-600 outline-none transition-all font-medium text-slate-900 dark:text-slate-100 min-h-[120px] resize-none"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Doctor & Time */}
          <div className="space-y-8">
            <Card className="rounded-[2.5rem] border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden bg-white dark:bg-[#0F172A] transition-colors duration-500">
              <CardHeader className="p-8 pb-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-black text-teal-900 dark:text-teal-400 flex items-center gap-3">
                    <Stethoscope className="text-teal-600" size={24} />
                    2. Choose Doctor
                  </CardTitle>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowOnlyAlternatives(!showOnlyAlternatives)}
                    className="text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-xl"
                  >
                    <Lightbulb size={16} className="mr-2" />
                    {showOnlyAlternatives ? "Show All Doctors" : "Suggest Alternatives"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                {loadingDoctors ? (
                  <div className="py-12 flex justify-center">
                    <Loader2 className="animate-spin text-teal-600" size={32} />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filteredDoctors.map((doc) => {
                      const isSelected = selectedDoctor === doc.doctorId;
                      const isFull = doc.workloadLevel === "FULL";
                      
                      return (
                        <div 
                          key={doc.doctorId}
                          onClick={() => !isFull && setSelectedDoctor(doc.doctorId)}
                          className={cn(
                            "p-5 rounded-2xl border-2 cursor-pointer transition-all relative overflow-hidden",
                            isSelected 
                              ? "border-teal-600 bg-teal-50 dark:bg-teal-900/20" 
                              : isFull 
                                ? "border-slate-100 dark:border-slate-800 opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-900/20" 
                                : "border-slate-100 dark:border-slate-800 hover:border-teal-300 dark:hover:border-teal-700 bg-white dark:bg-[#1E293B]"
                          )}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className={cn("font-bold", isSelected ? "text-teal-900 dark:text-teal-100" : "text-slate-900 dark:text-slate-100")}>
                                Dr. {doc.name}
                              </h4>
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{doc.specialization}</p>
                            </div>
                            <div className={cn("px-2 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1", getWorkloadColor(doc.workloadLevel))}>
                              {getWorkloadIcon(doc.workloadLevel)}
                              {doc.workloadLevel}
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                              📊 Today: {doc.appointmentCount} appointments
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-500">
                              Weekly Load: {doc.weeklyCount} appointments
                            </p>
                          </div>

                          {doc.workloadLevel === "HIGH" && !isSelected && (
                            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-orange-600 dark:text-orange-400 font-medium flex items-center gap-1">
                              <AlertTriangle size={14} /> Very busy today
                            </div>
                          )}
                          
                          {doc.workloadLevel === "LOW" && !isSelected && (
                            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                              <Check size={14} /> Recommended
                            </div>
                          )}

                          {isFull && (
                            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
                              <XCircle size={14} /> Fully Booked
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {selectedDoctor && (
                  <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800 animate-in fade-in duration-500">
                    <Label className="font-bold text-slate-700 dark:text-slate-300">3. Select Time Slot</Label>
                    <div className="relative">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
                      <select
                        value={time}
                        onChange={(e) => {
                          setTime(e.target.value);
                          setAvailable(null);
                        }}
                        className="w-full pl-12 pr-4 h-14 bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-200 dark:border-slate-800 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:border-teal-600 outline-none transition-all font-bold text-slate-900 dark:text-slate-100 appearance-none"
                        required
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
