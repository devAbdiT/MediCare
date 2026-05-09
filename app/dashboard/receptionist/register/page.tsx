// app/dashboard/receptionist/register/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { UserPlus, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function RegisterPatient() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }

      toast.success("Patient registered successfully!");
      router.push("/dashboard/receptionist");
    } catch (err: any) {
      toast.error(err.message || "Failed to register patient");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout role="receptionist">
      <div className="max-w-3xl mx-auto space-y-8 pb-10">
        <div>
          <h1 className="text-4xl font-black text-[#1A2A4A] dark:text-[#E8EEF8] tracking-tight flex items-center gap-4">
            <UserPlus className="text-[#1E4A8A] dark:text-[#4A8AC8]" size={40} />
            Patient Registration
          </h1>
          <p className="text-[#5A6E8A] dark:text-[#8A9CBA] mt-2 text-lg">Enter the details below to create a new patient profile.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="rounded-[3rem] border-[#D0DCE8] dark:border-[#1A2A4A] shadow-xl shadow-blue-500/5 overflow-hidden bg-white dark:bg-[#111C3A] transition-colors duration-500">
            <CardHeader className="bg-[#F0F4F8] dark:bg-[#0A122A] border-b border-[#D0DCE8] dark:border-[#1A2A4A] p-10 transition-colors duration-500">
              <CardTitle className="text-xl font-black text-[#1A2A4A] dark:text-[#E8EEF8]">Personal Information</CardTitle>
              <CardDescription className="text-[#5A6E8A] dark:text-[#8A9CBA] font-medium">All fields are required for medical compliance.</CardDescription>
            </CardHeader>
            <CardContent className="p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="font-black text-xs uppercase tracking-widest text-[#1A2A4A] dark:text-[#E8EEF8]">Full Name</Label>
                  <Input name="name" placeholder="John Doe" required className="rounded-2xl h-14 bg-[#F0F4F8] dark:bg-[#0A122A] border-[#D0DCE8] dark:border-[#1A2A4A] focus:ring-[#1E4A8A] text-[#1A2A4A] dark:text-[#E8EEF8] transition-colors duration-500" />
                </div>
                <div className="space-y-3">
                  <Label className="font-black text-xs uppercase tracking-widest text-[#1A2A4A] dark:text-[#E8EEF8]">Email Address</Label>
                  <Input name="email" type="email" placeholder="john@example.com" required className="rounded-2xl h-14 bg-[#F0F4F8] dark:bg-[#0A122A] border-[#D0DCE8] dark:border-[#1A2A4A] focus:ring-[#1E4A8A] text-[#1A2A4A] dark:text-[#E8EEF8] transition-colors duration-500" />
                </div>
                <div className="space-y-3">
                  <Label className="font-black text-xs uppercase tracking-widest text-[#1A2A4A] dark:text-[#E8EEF8]">Phone Number</Label>
                  <Input name="phone" placeholder="+251..." required className="rounded-2xl h-14 bg-[#F0F4F8] dark:bg-[#0A122A] border-[#D0DCE8] dark:border-[#1A2A4A] focus:ring-[#1E4A8A] text-[#1A2A4A] dark:text-[#E8EEF8] transition-colors duration-500" />
                </div>
                <div className="space-y-3">
                  <Label className="font-black text-xs uppercase tracking-widest text-[#1A2A4A] dark:text-[#E8EEF8]">Date of Birth</Label>
                  <Input name="dateOfBirth" type="date" required className="rounded-2xl h-14 bg-[#F0F4F8] dark:bg-[#0A122A] border-[#D0DCE8] dark:border-[#1A2A4A] focus:ring-[#1E4A8A] text-[#1A2A4A] dark:text-[#E8EEF8] transition-colors duration-500" />
                </div>
                <div className="space-y-3">
                  <Label className="font-black text-xs uppercase tracking-widest text-[#1A2A4A] dark:text-[#E8EEF8]">Blood Type</Label>
                  <select 
                    name="bloodType" 
                    className="w-full rounded-2xl h-14 border border-[#D0DCE8] dark:border-[#1A2A4A] bg-[#F0F4F8] dark:bg-[#0A122A] px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1E4A8A] text-[#1A2A4A] dark:text-[#E8EEF8] transition-colors duration-500"
                    required
                  >
                    <option value="">Select Type</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
                <div className="space-y-3">
                  <Label className="font-black text-xs uppercase tracking-widest text-[#1A2A4A] dark:text-[#E8EEF8]">Initial Password</Label>
                  <Input name="password" type="password" placeholder="••••••••" required className="rounded-2xl h-14 bg-[#F0F4F8] dark:bg-[#0A122A] border-[#D0DCE8] dark:border-[#1A2A4A] focus:ring-[#1E4A8A] text-[#1A2A4A] dark:text-[#E8EEF8] transition-colors duration-500" />
                </div>
              </div>

              <div className="pt-8 border-t border-[#F0F4F8] dark:border-[#0A122A] flex justify-end gap-4 transition-colors duration-500">
                <button 
                  type="button" 
                  onClick={() => router.back()}
                  className="rounded-2xl h-14 px-10 font-black uppercase tracking-widest border border-[#D0DCE8] dark:border-[#1A2A4A] text-[#5A6E8A] dark:text-[#8A9CBA] hover:bg-[#F0F4F8] dark:hover:bg-[#0A122A] transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="rounded-2xl h-14 px-12 font-black bg-[#1E4A8A] dark:bg-[#4A8AC8] hover:bg-[#0F3A6A] dark:hover:bg-[#1E4A8A] text-white shadow-xl shadow-[#1E4A8A]/20 transition-all flex items-center gap-2 uppercase tracking-widest"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={18} />}
                  Register Patient
                </button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </DashboardLayout>
  );
}
