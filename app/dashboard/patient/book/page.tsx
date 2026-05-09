// app/dashboard/patient/book/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Calendar, Clock, User, Loader2, Check } from "lucide-react";
import { toast } from "sonner";

export default function BookAppointment() {
  const router = useRouter();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [availability, setAvailability] = useState<boolean | null>(null);

  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  useEffect(() => {
    fetch("/api/doctors")
      .then(res => res.json())
      .then(data => setDoctors(data));
  }, []);

  const checkAvailability = async () => {
    if (!selectedDoctor || !selectedDate || !selectedTime) return;
    
    setChecking(true);
    try {
      const dateTime = `${selectedDate}T${selectedTime}`;
      const res = await fetch(`/api/appointments/check-availability?doctorId=${selectedDoctor}&dateTime=${dateTime}`);
      const data = await res.json();
      setAvailability(data.available);
      if (!data.available) {
        toast.error("Doctor is not available at this time.");
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
          reason: "General Consultation"
        }),
      });

      if (!res.ok) throw new Error("Failed to book appointment");

      toast.success("Appointment booked successfully!");
      router.push("/dashboard/patient");
    } catch (err) {
      toast.error("An error occurred during booking.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout role="patient">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Book Appointment</h1>
          <p className="text-slate-500 mt-2 text-lg">Choose a specialist and select your preferred time.</p>
        </div>

        <Card className="rounded-[2.5rem] border-slate-100 shadow-xl overflow-hidden">
          <CardHeader className="bg-slate-50/50 p-8 border-b">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Calendar className="text-blue-600" />
              Appointment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleBook} className="space-y-6">
              <div className="space-y-2">
                <Label className="font-bold text-slate-700">Select Specialist</Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <select
                    value={selectedDoctor}
                    onChange={(e) => {
                      setSelectedDoctor(e.target.value);
                      setAvailability(null);
                    }}
                    className="w-full pl-12 pr-4 h-14 rounded-2xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-600 outline-none appearance-none font-medium"
                    required
                  >
                    <option value="">Choose a doctor...</option>
                    {doctors.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.user.name} ({doc.specialization})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="font-bold text-slate-700">Preferred Date</Label>
                  <Input 
                    type="date" 
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setAvailability(null);
                    }}
                    className="h-14 rounded-2xl" 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-slate-700">Preferred Time</Label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <select
                      value={selectedTime}
                      onChange={(e) => {
                        setSelectedTime(e.target.value);
                        setAvailability(null);
                      }}
                      className="w-full pl-12 pr-4 h-14 rounded-2xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-600 outline-none appearance-none font-medium"
                      required
                    >
                      <option value="">Select time...</option>
                      {["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-4">
                {availability === true ? (
                  <div className="flex items-center gap-2 text-emerald-600 font-bold">
                    <Check size={20} />
                    This slot is available for booking!
                  </div>
                ) : (
                  <Button 
                    type="button" 
                    variant="secondary"
                    onClick={checkAvailability}
                    disabled={checking || !selectedDoctor || !selectedDate || !selectedTime}
                    className="rounded-xl font-bold px-6"
                  >
                    {checking ? <Loader2 className="animate-spin mr-2" /> : null}
                    Check Availability
                  </Button>
                )}
              </div>

              <div className="pt-6 flex justify-end">
                <Button 
                  type="submit"
                  disabled={loading || !availability}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-black h-14 px-12 rounded-2xl shadow-xl shadow-blue-200 transition-all disabled:opacity-50"
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
