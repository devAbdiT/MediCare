// app/dashboard/patient/profile/page.tsx
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import prisma from "@/lib/prisma";
import { format } from "date-fns";
import { User, Phone, Mail, Calendar, Droplets, ShieldCheck } from "lucide-react";
import ProfileForm from "./ProfileForm";

export default async function PatientProfilePage() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session || session.user.role !== "PATIENT") {
    redirect("/login");
  }

  const patient = await prisma.patient.findUnique({
    where: { userId: session.user.id },
    include: { user: true }
  });

  if (!patient) {
    redirect("/dashboard/patient");
  }

  return (
    <DashboardLayout role="patient">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Your Profile</h1>
          <p className="text-slate-500 mt-2 font-medium">Manage your personal information and security settings</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Info Side */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm text-center">
              <div className="w-24 h-24 rounded-[2rem] bg-blue-600 text-white flex items-center justify-center mx-auto text-3xl font-black shadow-xl shadow-blue-100 mb-6">
                {patient.user.name[0]}
              </div>
              <h2 className="text-2xl font-black text-slate-900">{patient.user.name}</h2>
              <p className="text-slate-400 font-bold text-sm uppercase tracking-widest mt-1">Patient ID: {patient.id.slice(-6).toUpperCase()}</p>
            </div>

            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white space-y-6">
              <h3 className="font-bold flex items-center gap-2">
                <ShieldCheck className="text-blue-400" size={20} />
                Medical Data
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-white/10">
                  <span className="text-white/60 text-sm font-medium">Blood Type</span>
                  <span className="font-black text-emerald-400">{patient.bloodType || "N/A"}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-white/10">
                  <span className="text-white/60 text-sm font-medium">Date of Birth</span>
                  <span className="font-bold">{format(new Date(patient.dateOfBirth), "MMM dd, yyyy")}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Form Side */}
          <div className="lg:col-span-2">
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
              <ProfileForm initialPhone={patient.user.phone || ""} />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
