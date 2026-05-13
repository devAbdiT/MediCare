// app/dashboard/admin/users/[id]/page.tsx
import React from "react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import prisma from "@/lib/prisma";
import { format, differenceInYears } from "date-fns";
import { ArrowLeft, Building2 } from "lucide-react";
import Link from "next/link";
import { PrintButton } from "@/components/admin/PrintButton";

export default async function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session || (session.user as any).role !== "ADMIN") {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      patient: {
        include: {
          medicalRecords: {
            include: { doctor: { include: { user: { select: { name: true } } } } },
            orderBy: { date: "desc" }
          }
        }
      },
      doctor: {
        include: {
          appointments: {
            include: { patient: { include: { user: { select: { name: true } } } } },
            orderBy: { dateTime: "desc" },
            take: 10
          }
        }
      }
    }
  });

  if (!user) {
    redirect("/dashboard/admin/users");
  }

  const age = user.patient ? differenceInYears(new Date(), new Date(user.patient.dateOfBirth)) : null;
  const adminName = session.user.name;

  return (
    <DashboardLayout role="admin">
      <div className="space-y-10 pb-20">
        {/* Navigation Header - Hidden on Print (FR-34) */}
        <div className="flex items-center justify-between no-print">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/admin/users" className="p-3 bg-white dark:bg-[#111C3A] border border-[#D0DCE8] dark:border-[#1A2A4A] rounded-2xl text-[#5A6E8A] hover:text-[#1E4A8A] transition-all shadow-sm">
              <ArrowLeft size={24} />
            </Link>
            <div>
              <h1 className="text-3xl font-black text-[#1A2A4A] dark:text-[#E8EEF8] tracking-tight">Report Generator</h1>
              <p className="text-[#5A6E8A] dark:text-[#8A9CBA] font-medium">Digital clinical manifest for {user.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-8 py-4 bg-[#1E4A8A] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#0F3A6A] transition-all shadow-xl shadow-blue-500/10">
            <PrintButton 
              targetId="print-content"
              label={user.role === "PATIENT" ? "Print Patient Report" : "Print User Report"}
            />
          </div>
        </div>

        {/* THE REPORT TEMPLATE - FR-29, FR-30, FR-33, FR-34 */}
        <div className="bg-white p-12 rounded-[2rem] shadow-2xl border border-[#D0DCE8] max-w-5xl mx-auto print:shadow-none print:border-none print:p-0 print:m-0 transition-colors duration-500">
          
          {/* 1. Hospital Header (FR-33) */}
          <div className="flex justify-between items-start mb-10">
            <div className="flex items-start gap-6">
              <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center text-[#1E4A8A]">
                <Building2 size={40} />
              </div>
              <div className="space-y-1">
                <h2 className="text-4xl font-black text-[#1A2A4A] tracking-tighter">Jimma Medical Center</h2>
                <p className="text-sm font-medium text-[#5A6E8A]">Jimma Medical Center Clinical Management System (PDMS)</p>
                <p className="text-xs font-bold text-[#8A9CBA] uppercase tracking-widest">Jimma, Oromia, Ethiopia</p>
              </div>
            </div>
            <div className="text-right">
              <h3 className="text-2xl font-black text-[#1E4A8A] uppercase tracking-widest mb-1">
                {user.role} IDENTITY REPORT
              </h3>
              <p className="text-[10px] font-black text-[#8A9CBA] uppercase tracking-widest">Generated At: {format(new Date(), "M/d/yyyy, h:mm:ss a")}</p>
              <p className="text-[10px] font-black text-[#1E4A8A] uppercase tracking-widest mt-1">Printed By: {adminName}</p>
            </div>
          </div>

          <div className="h-1 bg-[#1E4A8A] w-full mb-12" />

          {/* 2. User Information (FR-29, FR-30) */}
          <div className="space-y-10">
            <div>
              <h4 className="text-[10px] font-black text-[#1E4A8A] uppercase tracking-[0.2em] mb-6 pb-2 border-b border-slate-100">Identity Information</h4>
              <div className="grid grid-cols-3 gap-y-8">
                <ReportField label="First Name" value={user.name.split(" ")[0]} />
                <ReportField label="Middle Name" value="-" />
                <ReportField label="Last Name" value={user.name.split(" ").slice(1).join(" ") || "-"} />
                
                <ReportField label="System ID" value={`BK-${user.id.slice(-4).toUpperCase()}`} isBlue />
                {user.role === "PATIENT" ? (
                  <>
                    <ReportField label="Date of Birth" value={user.patient ? format(new Date(user.patient.dateOfBirth), "M/d/yyyy") : "-"} />
                    <ReportField label="Age" value={age?.toString() || "-"} />
                  </>
                ) : (
                  <>
                    <ReportField label="Registry Date" value={format(new Date(user.createdAt), "M/d/yyyy")} />
                    <ReportField label="Account Status" value="ACTIVE" />
                  </>
                )}
                
                <ReportField label="Gender" value={user.gender || "NOT SPECIFIED"} />
                <ReportField label="Phone" value={user.phone || "-"} />
                <ReportField label="Email" value={user.email} />
              </div>
            </div>

            {/* 3. Role-Specific Details (FR-30) */}
            {user.role === "DOCTOR" && user.doctor && (
              <div>
                <h4 className="text-[10px] font-black text-[#1E4A8A] uppercase tracking-[0.2em] mb-6 pb-2 border-b border-slate-100">Specialization & Node</h4>
                <div className="grid grid-cols-2 gap-8">
                   <ReportField label="Primary Specialization" value={user.doctor.specialization} />
                   <ReportField label="Clinic Assignment" value="Main Branch - Ward A" />
                </div>
              </div>
            )}

            {/* 4. Address */}
            <div>
              <h4 className="text-[10px] font-black text-[#1E4A8A] uppercase tracking-[0.2em] mb-6 pb-2 border-b border-slate-100">Registered Address</h4>
              <p className="text-lg font-bold text-[#1A2A4A]">Oromia, Jimma Medical Center, Jimma District, Ethiopia</p>
            </div>

            {/* 5. Reports & History (FR-29) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-4">
              {/* Encounter / Appointment History */}
              <div>
                <h4 className="text-[10px] font-black text-[#1E4A8A] uppercase tracking-[0.2em] mb-6 pb-2 border-b border-slate-100">
                  {user.role === "PATIENT" ? "Encounter History" : "Recent Activity Manifest"}
                </h4>
                {user.role === "PATIENT" ? (
                  user.patient?.medicalRecords.length === 0 ? (
                    <p className="text-sm font-medium text-[#8A9CBA] italic">No medical records indexed</p>
                  ) : (
                    <div className="space-y-6">
                      {user.patient?.medicalRecords.map((record) => (
                        <div key={record.id} className="space-y-1">
                          <p className="text-lg font-black text-[#1A2A4A]">{format(new Date(record.date), "M/d/yyyy")}</p>
                          <p className="text-sm font-medium text-[#5A6E8A]">{record.diagnosis}</p>
                          <p className="text-[10px] font-bold text-[#8A9CBA] italic">Dr. {record.doctor.user.name}</p>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm font-medium text-[#5A6E8A]">Standard operational manifest recorded.</p>
                  </div>
                )}
              </div>

              {/* Medical Record Report */}
              <div>
                <h4 className="text-[10px] font-black text-[#1E4A8A] uppercase tracking-[0.2em] mb-6 pb-2 border-b border-slate-100">Record Observations</h4>
                <p className="text-sm font-medium text-[#8A9CBA] italic">No additional clinical observations found for this node.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function ReportField({ label, value, isBlue }: { label: string; value: string; isBlue?: boolean }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-black text-[#8A9CBA] uppercase tracking-widest">{label}</p>
      <p className={`text-lg font-black ${isBlue ? "text-[#1E4A8A]" : "text-[#1A2A4A]"}`}>{value}</p>
    </div>
  );
}
