// app/dashboard/patient/profile/page.tsx
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import prisma from "@/lib/prisma";
import { differenceInYears, format } from "date-fns";
import {
  User,
  Droplets,
  Hash,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import ProfileTabs from "./ProfileTabs";
import React from "react";

export default async function PatientProfilePage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session || (session.user as any).role !== "PATIENT") {
    redirect("/login");
  }

  const patient = await prisma.patient.findUnique({
    where: { userId: session.user.id },
    include: {
      user: true,
      allergies: { orderBy: { confirmedAt: "desc" } },
      conditions: { orderBy: { diagnosedAt: "desc" } },
    },
  });

  if (!patient) redirect("/dashboard/patient");

  const computedAge =
    patient.age ??
    (patient.dateOfBirth
      ? differenceInYears(new Date(), new Date(patient.dateOfBirth))
      : null);

  const severeCount = patient.allergies.filter(
    (a) => a.severity === "SEVERE" || a.severity === "LIFE_THREATENING"
  ).length;

  // Serialize dates for the client — build explicitly to avoid Prisma type conflicts
  const serializedPatient = {
    id: patient.id,
    userId: patient.userId,
    dateOfBirth: patient.dateOfBirth?.toISOString() ?? null,
    age: patient.age,
    bloodType: patient.bloodType,
    cardNumber: patient.cardNumber,
    address: patient.address,
    city: patient.city,
    region: patient.region,
    emergencyName: patient.emergencyName,
    emergencyPhone: patient.emergencyPhone,
    emergencyRelation: patient.emergencyRelation,
    patientStatus: patient.patientStatus,
    insuranceProvider: patient.insuranceProvider,
    insurancePolicyNo: patient.insurancePolicyNo,
    insuranceCoverage: patient.insuranceCoverage,
    insuranceExpiry: patient.insuranceExpiry?.toISOString() ?? null,
    allergies: patient.allergies.map((a) => ({
      ...a,
      confirmedAt: a.confirmedAt?.toISOString() ?? null,
    })),
    medicalConditions: patient.conditions.map((c) => ({
      ...c,
      diagnosedAt: c.diagnosedAt?.toISOString() ?? null,
    })),
    user: {
      id: patient.user.id,
      name: patient.user.name,
      email: patient.user.email,
      phone: patient.user.phone,
      role: patient.user.role,
      emailVerified: patient.user.emailVerified,
      createdAt: patient.user.createdAt.toISOString(),
      updatedAt: patient.user.updatedAt.toISOString(),
    },
  };

  return (
    <DashboardLayout role="patient">
      <div className="space-y-10 pb-10">
        {/* Page Header */}
        <div>
          <h1 className="text-4xl font-black text-[#1E293B] dark:text-[#F1F5F9] tracking-tight">
            Patient Profile
          </h1>
          <p className="text-[#64748B] dark:text-[#94A3B8] mt-2 text-lg font-medium">
            Manage your clinical record, contacts, insurance and health data
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* ── Left Column: Identity card ── */}
          <div className="space-y-6">
            {/* Avatar / name card */}
            <div className="bg-white dark:bg-[#1E293B] p-8 rounded-[3rem] border border-[#E2E8F0] dark:border-[#334155] shadow-sm text-center group transition-all duration-500">
              <div className="w-28 h-28 rounded-[2rem] bg-[#F8FAFC] dark:bg-[#0F172A] flex items-center justify-center mx-auto mb-5 border border-[#E2E8F0] dark:border-[#334155] group-hover:scale-105 transition-transform duration-500">
                <User size={56} className="text-[#1E3A5F] dark:text-blue-400" />
              </div>
              <h2 className="text-xl font-black text-[#1E293B] dark:text-[#F1F5F9]">
                {patient.user.name}
              </h2>
              <p className="text-[#64748B] dark:text-[#94A3B8] font-bold text-xs uppercase tracking-widest mt-1">
                Verified Patient
              </p>

              {/* Stats row */}
              <div className="mt-6 pt-6 border-t border-[#F8FAFC] dark:border-[#0F172A] grid grid-cols-3 gap-3">
                <div>
                  <p className="text-[9px] font-black text-[#64748B] dark:text-[#94A3B8] uppercase tracking-widest mb-1">
                    Blood
                  </p>
                  <p className="text-sm font-black text-red-500 dark:text-red-400 flex items-center justify-center gap-0.5">
                    <Droplets size={12} />
                    {patient.bloodType || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-[#64748B] dark:text-[#94A3B8] uppercase tracking-widest mb-1">
                    Age
                  </p>
                  <p className="text-sm font-black text-blue-500 dark:text-blue-400 flex items-center justify-center gap-0.5">
                    <Hash size={12} />
                    {computedAge !== null ? `${computedAge}y` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-[#64748B] dark:text-[#94A3B8] uppercase tracking-widest mb-1">
                    Since
                  </p>
                  <p className="text-sm font-black text-[#1E293B] dark:text-[#F1F5F9]">
                    {format(patient.user.createdAt, "yyyy")}
                  </p>
                </div>
              </div>
            </div>

            {/* Status badge */}
            <div className="bg-[#1E3A5F] p-6 rounded-[2rem] text-white flex items-center gap-4 shadow-xl shadow-[#1E3A5F]/15">
              <ShieldCheck size={28} />
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest opacity-60">
                  Status
                </p>
                <p className="font-black text-sm">Active Clinical Record</p>
              </div>
            </div>

            {/* Severe allergy badge (visible on sidebar too) */}
            {severeCount > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-400 dark:border-red-600 p-5 rounded-[2rem] flex items-center gap-4">
                <AlertTriangle className="text-red-600 dark:text-red-400 shrink-0" size={24} />
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-red-700 dark:text-red-400">
                    ⚠ Severe Allergy
                  </p>
                  <p className="text-sm font-black text-red-800 dark:text-red-300">
                    {severeCount} recorded
                  </p>
                </div>
              </div>
            )}

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl p-5 text-center">
                <p className="text-2xl font-black text-[#1E3A5F] dark:text-blue-400">
                  {patient.allergies.length}
                </p>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                  Allergies
                </p>
              </div>
              <div className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl p-5 text-center">
                <p className="text-2xl font-black text-[#1E3A5F] dark:text-blue-400">
                  {patient.conditions.length}
                </p>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                  Conditions
                </p>
              </div>
            </div>
          </div>

          {/* ── Right Column: Tabs ── */}
          <div className="lg:col-span-2">
            <ProfileTabs
              patient={serializedPatient as any}
              canWrite={false}
              isPatient={true}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
