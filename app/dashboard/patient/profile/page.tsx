// app/dashboard/patient/profile/page.tsx
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import prisma from "@/lib/prisma";
import { format, differenceInYears } from "date-fns";
import { User, Phone, Mail, Calendar, Droplets, ShieldCheck, Hash } from "lucide-react";
import ProfileForm from "./ProfileForm";
import React from "react";

export default async function PatientProfilePage() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session || (session.user as any).role !== "PATIENT") {
    redirect("/login");
  }

  const patient = await prisma.patient.findUnique({
    where: { userId: session.user.id },
    include: { user: true }
  });

  // Compute age: prefer stored age, else calculate from DOB
  const computedAge = patient?.age
    ?? (patient?.dateOfBirth ? differenceInYears(new Date(), new Date(patient.dateOfBirth)) : null);

  if (!patient) {
    redirect("/dashboard/patient");
  }

  return (
    <DashboardLayout role="patient">
      <div className="space-y-10 pb-10">
        <div>
          <h1 className="text-4xl font-black text-[#1E293B] dark:text-[#F1F5F9] tracking-tight">Identity & Security</h1>
          <p className="text-[#64748B] dark:text-[#94A3B8] mt-2 text-lg font-medium">Manage your clinical profile and contact details</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left Column: Stats & ID */}
          <div className="space-y-8">
            <div className="bg-white dark:bg-[#1E293B] p-10 rounded-[3rem] border border-[#E2E8F0] dark:border-[#334155] shadow-sm text-center group transition-all duration-500">
               <div className="w-32 h-32 rounded-[2.5rem] bg-[#F8FAFC] dark:bg-[#0F172A] flex items-center justify-center mx-auto mb-6 border border-[#E2E8F0] dark:border-[#334155] group-hover:scale-105 transition-transform duration-500">
                  <User size={64} className="text-[#3B82F6] dark:text-[#60A5FA]" />
               </div>
               <h2 className="text-2xl font-black text-[#1E293B] dark:text-[#F1F5F9]">{patient.user.name}</h2>
               <p className="text-[#64748B] dark:text-[#94A3B8] font-bold text-sm uppercase tracking-widest mt-1">Verified Patient</p>
               
               <div className="mt-8 pt-8 border-t border-[#F8FAFC] dark:border-[#0F172A] grid grid-cols-3 gap-4">
                   <div>
                     <p className="text-[10px] font-black text-[#64748B] dark:text-[#94A3B8] uppercase tracking-widest mb-1">Blood Type</p>
                     <p className="text-base font-black text-[#EF4444] dark:text-[#F87171] flex items-center justify-center gap-1">
                       <Droplets size={14} />
                       {patient.bloodType || "—"}
                     </p>
                   </div>
                   <div>
                     <p className="text-[10px] font-black text-[#64748B] dark:text-[#94A3B8] uppercase tracking-widest mb-1">Age</p>
                     <p className="text-base font-black text-[#3B82F6] dark:text-[#60A5FA] flex items-center justify-center gap-1">
                       <Hash size={14} />
                       {computedAge !== null ? `${computedAge} yrs` : "—"}
                     </p>
                   </div>
                   <div>
                     <p className="text-[10px] font-black text-[#64748B] dark:text-[#94A3B8] uppercase tracking-widest mb-1">Since</p>
                     <p className="text-base font-black text-[#1E293B] dark:text-[#F1F5F9]">{format(patient.user.createdAt, "yyyy")}</p>
                   </div>
                </div>
            </div>

            <div className="bg-[#3B82F6] p-8 rounded-[2.5rem] text-white flex items-center gap-4 shadow-xl shadow-blue-500/10">
               <ShieldCheck size={32} />
               <div>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Status</p>
                  <p className="font-black">Active Clinical Record</p>
               </div>
            </div>
          </div>

          {/* Right Column: Details & Edit */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white dark:bg-[#1E293B] p-10 rounded-[3rem] border border-[#E2E8F0] dark:border-[#334155] shadow-sm transition-colors duration-500">
               <h3 className="text-xl font-black text-[#1E293B] dark:text-[#F1F5F9] mb-8 flex items-center gap-3">
                  Clinical Information
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <DetailItem icon={<Mail />} label="Primary Email" value={patient.user.email} />
                   <DetailItem icon={<Phone />} label="Phone Number" value={patient.user.phone || "—"} />
                   {patient.dateOfBirth && (
                     <DetailItem icon={<Calendar />} label="Date of Birth" value={format(new Date(patient.dateOfBirth), "MMMM dd, yyyy")} />
                   )}
                   {computedAge !== null && (
                     <DetailItem icon={<Hash />} label="Age" value={`${computedAge} years old`} />
                   )}
                   {patient.bloodType && (
                     <DetailItem icon={<Droplets />} label="Blood Type" value={patient.bloodType} />
                   )}
                </div>
            </div>

            <div className="bg-white dark:bg-[#1E293B] p-10 rounded-[3rem] border border-[#E2E8F0] dark:border-[#334155] shadow-sm transition-colors duration-500">
               <h3 className="text-xl font-black text-[#1E293B] dark:text-[#F1F5F9] mb-8">Update Access Settings</h3>
               <ProfileForm initialPhone={patient.user.phone || ""} />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function DetailItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-4 p-5 rounded-2xl bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] transition-colors duration-500">
       <div className="text-[#3B82F6] dark:text-[#60A5FA] mt-1">
          {React.cloneElement(icon as React.ReactElement, { size: 20 } as any)}
       </div>
       <div>
          <p className="text-[10px] font-black text-[#64748B] dark:text-[#94A3B8] uppercase tracking-widest mb-1">{label}</p>
          <p className="text-sm font-bold text-[#1E293B] dark:text-[#F1F5F9]">{value}</p>
       </div>
    </div>
  );
}
