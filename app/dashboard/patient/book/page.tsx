"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Calendar, Clock, Loader2, Check, AlertTriangle, Lightbulb, Activity, XCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface DoctorWorkload {
  doctorId: string;
  name: string;
  specialization: string;
  appointmentCount: number;
  weeklyCount: number;
  workloadLevel: "LOW" | "MEDIUM" | "HIGH" | "FULL";
  available: boolean;
}

export default function BookAppointment() {
  const router = useRouter();
  const [doctors, setDoctors] = useState<DoctorWorkload[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [availability, setAvailability] = useState<boolean | null>(null);
  const [doctorAvailability, setDoctorAvailability] = useState<any[]>([]);

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [showOnlyAlternatives, setShowOnlyAlternatives] = useState(false);
  const [appointmentType, setAppointmentType] = useState("NEW_VISIT");
  const [priority, setPriority] = useState("NORMAL");

  useEffect(() => {
    if (!selectedDate) return;
    
    setLoadingDoctors(true);
    fetch(`/api/doctors/workload?date=${selectedDate}`)
      .then(res => res.json())
      .then(data => {
        // Sort by workload level (LOW first, FULL last)
        const sorted = data.sort((a: DoctorWorkload, b: DoctorWorkload) => {
          const rank = { LOW: 1, MEDIUM: 2, HIGH: 3, FULL: 4 };
          return rank[a.workloadLevel] - rank[b.workloadLevel];
        });
        setDoctors(sorted);
        // Reset selection if the doctor is no longer available
        if (selectedDoctor && !sorted.find((d: any) => d.doctorId === selectedDoctor)?.available) {
          setSelectedDoctor("");
        }
      })
      .catch(() => toast.error("Failed to load doctors"))
      .finally(() => setLoadingDoctors(false));
  }, [selectedDate]);

  useEffect(() => {
    if (!selectedDoctor) {
      setDoctorAvailability([]);
      return;
    }
    fetch(`/api/doctors/${selectedDoctor}/availability`)
      .then(res => res.json())
      .then(data => setDoctorAvailability(data))
      .catch(console.error);
  }, [selectedDoctor]);

  const formatAvailability = () => {
    if (!doctorAvailability || doctorAvailability.length === 0) return "Loading availability...";
    const activeDays = doctorAvailability.filter(a => a.isActive);
    if (activeDays.length === 0) return "Not available this week.";
    
    const isStandard = activeDays.length === 5 && 
                       activeDays.every(a => a.dayOfWeek >= 1 && a.dayOfWeek <= 5) &&
                       activeDays.every(a => a.startTime === "08:00" && a.endTime === "17:00");
                       
    if (isStandard) return "Available Monday–Friday, 08:00–17:00";
    
    // Generic fallback for custom hours
    const first = activeDays[0];
    return `Working hours include: ${first.startTime} - ${first.endTime}`;
  };

  const checkAvailability = async () => {
    if (!selectedDoctor || !selectedDate || !selectedTime) return;
    
    setChecking(true);
    try {
      const dateTime = `${selectedDate}T${selectedTime}`;
      const res = await fetch(`/api/appointments/check-availability?doctorId=${selectedDoctor}&dateTime=${dateTime}`);
      const data = await res.json();
      setAvailability(data.available);
      if (!data.available) {
        toast.error(data.message || "Doctor is not available at this time.");
      } else {
        toast.success("Time slot is available!");
      }
    } catch (err) {
      toast.error("Failed to check availability.");
    } finally {
      setChecking(false);
    }
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!availability) {
      toast.error("Please verify availability first.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId: selectedDoctor,
          dateTime: `${selectedDate}T${selectedTime}`,
          reason: "General Consultation",
          appointmentType,
          priority
        }),
      });

      if (!res.ok) throw new Error("Failed to book appointment");

      toast.success("Appointment booked successfully!");
      router.push("/dashboard/patient");
    } catch (err: any) {
      toast.error(err.message || "An error occurred during booking.");
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
    <DashboardLayout role="patient">
      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Book Appointment</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Choose a specialist and select your preferred time.</p>
        </div>

        <Card className="rounded-[2.5rem] border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden bg-white dark:bg-[#0F172A] transition-colors duration-500">
          <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 p-8 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-xl font-bold flex items-center gap-2 dark:text-slate-100">
              <Calendar className="text-blue-600 dark:text-blue-400" />
              Appointment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleBook} className="space-y-8">
              
              {/* Date Selection */}
              <div className="space-y-2">
                <Label className="font-bold text-slate-700 dark:text-slate-300">1. Select Date</Label>
                <Input 
                  type="date" 
                  value={selectedDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setAvailability(null);
                    setSelectedDoctor("");
                    setSelectedTime("");
                  }}
                  className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 dark:text-slate-100 font-medium" 
                  required 
                />
              </div>

              {/* Doctor Selection */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="font-bold text-slate-700 dark:text-slate-300">2. Select Specialist</Label>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowOnlyAlternatives(!showOnlyAlternatives)}
                    className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl"
                  >
                    <Lightbulb size={16} className="mr-2" />
                    {showOnlyAlternatives ? "Show All Doctors" : "Suggest Alternatives"}
                  </Button>
                </div>

                {loadingDoctors ? (
                  <div className="py-12 flex justify-center">
                    <Loader2 className="animate-spin text-blue-600" size={32} />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                              ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20" 
                              : isFull 
                                ? "border-slate-100 dark:border-slate-800 opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-900/20" 
                                : "border-slate-100 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 bg-white dark:bg-[#1E293B]"
                          )}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className={cn("font-bold", isSelected ? "text-blue-900 dark:text-blue-100" : "text-slate-900 dark:text-slate-100")}>
                                Dr. {doc.name}
                              </h4>
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{doc.specialization}</p>
                            </div>
                            <div className={cn("px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1", getWorkloadColor(doc.workloadLevel))}>
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
                              <AlertTriangle size={14} /> This doctor is very busy today
                            </div>
                          )}
                          
                          {doc.workloadLevel === "LOW" && !isSelected && (
                            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                              <Check size={14} /> Recommended (Lighter Load)
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
              </div>

              {/* Time Selection */}
              {selectedDoctor && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {/* Doctor Availability Summary */}
                  {doctorAvailability.length > 0 && (
                    <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900 flex items-start gap-3">
                      <Clock className="text-blue-500 mt-0.5 shrink-0" size={18} />
                      <div>
                        <p className="text-sm font-bold text-blue-900 dark:text-blue-100">Doctor Working Hours</p>
                        <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mt-1">
                          {formatAvailability()}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                    <Label className="font-bold text-slate-700 dark:text-slate-300">3. Preferred Time</Label>
                    <div className="relative">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
                      <select
                        value={selectedTime}
                        onChange={(e) => {
                          setSelectedTime(e.target.value);
                          setAvailability(null);
                        }}
                        className="w-full pl-12 pr-4 h-14 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 dark:text-slate-100 focus:ring-2 focus:ring-blue-600 outline-none appearance-none font-medium"
                        required
                      >
                        <option value="">Select time...</option>
                        {["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00"].map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700 dark:text-slate-300">4. Appointment Type</Label>
                    <select
                      value={appointmentType}
                      onChange={(e) => setAppointmentType(e.target.value)}
                      className="w-full px-4 h-14 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 dark:text-slate-100 focus:ring-2 focus:ring-blue-600 outline-none font-medium"
                      required
                    >
                      <option value="NEW_VISIT">New Visit</option>
                      <option value="FOLLOW_UP">Follow-up</option>
                      <option value="CONSULTATION">Consultation</option>
                      <option value="EMERGENCY">Emergency</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700 dark:text-slate-300">5. Priority</Label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full px-4 h-14 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 dark:text-slate-100 focus:ring-2 focus:ring-blue-600 outline-none font-medium"
                      required
                    >
                      <option value="NORMAL">Normal</option>
                      <option value="URGENT">Urgent</option>
                      <option value="EMERGENCY">Emergency</option>
                    </select>
                  </div>
                </div>
              </div>
              )}

              {/* Availability Check */}
              {selectedDoctor && selectedTime && (
                <div className="p-6 bg-slate-50 dark:bg-slate-900/30 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-4 animate-in fade-in zoom-in-95 duration-300">
                  {availability === true ? (
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-lg">
                      <Check size={24} />
                      This slot is available for booking!
                    </div>
                  ) : (
                    <Button 
                      type="button" 
                      variant="secondary"
                      onClick={checkAvailability}
                      disabled={checking}
                      className="rounded-xl font-bold px-8 h-12 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                      {checking ? <Loader2 className="animate-spin mr-2" /> : null}
                      Verify Slot Availability
                    </Button>
                  )}
                </div>
              )}

              {/* Submit */}
              <div className="pt-6 flex justify-end">
                <Button 
                  type="submit"
                  disabled={loading || !availability}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-black h-14 px-12 rounded-2xl shadow-xl shadow-blue-500/20 transition-all disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin mr-2" /> : null}
                  Confirm Appointment
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
