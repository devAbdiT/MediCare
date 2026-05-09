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
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
            <UserPlus className="text-blue-600" size={40} />
            Patient Registration
          </h1>
          <p className="text-slate-500 mt-2 text-lg">Enter the details below to create a new patient profile.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="rounded-3xl border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8">
              <CardTitle className="text-xl font-bold text-slate-800">Personal Information</CardTitle>
              <CardDescription>All fields are required for medical compliance.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="font-bold text-slate-700">Full Name</Label>
                  <Input name="name" placeholder="John Doe" required className="rounded-xl h-12" />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-slate-700">Email Address</Label>
                  <Input name="email" type="email" placeholder="john@example.com" required className="rounded-xl h-12" />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-slate-700">Phone Number</Label>
                  <Input name="phone" placeholder="+251..." required className="rounded-xl h-12" />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-slate-700">Date of Birth</Label>
                  <Input name="dateOfBirth" type="date" required className="rounded-xl h-12" />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-slate-700">Blood Type</Label>
                  <select 
                    name="bloodType" 
                    className="w-full rounded-xl h-12 border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
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
                <div className="space-y-2">
                  <Label className="font-bold text-slate-700">Set Initial Password</Label>
                  <Input name="password" type="password" placeholder="••••••••" required className="rounded-xl h-12" />
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex justify-end gap-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.back()}
                  className="rounded-xl h-12 px-8 font-bold"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="rounded-xl h-12 px-10 font-black bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 transition-all flex items-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={18} />}
                  Register Patient
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </DashboardLayout>
  );
}
