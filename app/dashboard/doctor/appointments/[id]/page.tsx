// app/dashboard/doctor/appointments/[id]/page.tsx
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import prisma from "@/lib/prisma";
import { format } from "date-fns";
import { User, Clipboard, FileText, Pill, ChevronLeft } from "lucide-react";
import Link from "next/link";
import RecordForm from "./RecordForm";
import { PrintHistoryButton } from "./PrintHistoryButton";
import VitalsForm from "@/components/doctor/VitalsForm";

export default async function AppointmentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session || (session.user as any).role !== "DOCTOR") {
    redirect("/login");
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: {
      patient: {
        include: {
          user: { select: { name: true, phone: true, email: true } },
          medicalRecords: {
            include: { doctor: { include: { user: { select: { name: true } } } } },
            orderBy: { date: "desc" }
          }
        }
      },
      doctor: { select: { id: true, user: { select: { name: true } } } }
    }
  });

  if (!appointment) {
    redirect("/dashboard/doctor");
  }

  return (
    <DashboardLayout role="doctor">
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/doctor" className="p-3 bg-[#F0F4F8] dark:bg-[#0A122A] border border-[#D0DCE8] dark:border-[#1A2A4A] rounded-2xl text-[#5A6E8A] dark:text-[#8A9CBA] hover:text-[#1E4A8A] dark:hover:text-[#4A8AC8] transition-colors">
            <ChevronLeft size={24} />
          </Link>
          <div>
            <h1 className="text-3xl font-black text-[#1A2A4A] dark:text-[#E8EEF8] tracking-tight">Patient Workspace</h1>
            <p className="text-[#5A6E8A] dark:text-[#8A9CBA] font-medium">Managing visit for {appointment.patient.user.name}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Side */}
          <div className="lg:col-span-2 space-y-8">
            <div className="space-y-2">
              <span className="text-xs font-black text-[#5A6E8A] uppercase tracking-widest">Step 1: Record Vital Signs</span>
              <VitalsForm appointmentId={appointment.id} patientId={appointment.patientId} />
            </div>
            
            <div className="space-y-2">
              <span className="text-xs font-black text-[#5A6E8A] uppercase tracking-widest">Step 2: Submit Medical Record</span>
              <RecordForm 
                appointment={appointment} 
              />
            </div>
          </div>

          {/* History Side */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-[#111C3A] p-8 rounded-[2.5rem] border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-sm">
              <h3 className="font-bold text-[#1A2A4A] dark:text-[#E8EEF8] mb-6 flex items-center gap-2">
                <Clipboard className="text-[#1E4A8A] dark:text-[#4A8AC8]" size={20} />
                Medical History
              </h3>
              
              {appointment.patient.medicalRecords.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-[#5A6E8A] dark:text-[#8A9CBA]/60 text-sm font-medium italic">No previous records found.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {appointment.patient.medicalRecords.map((record) => (
                    <div key={record.id} className="relative pl-6 border-l-2 border-[#D0DCE8] dark:border-[#1A2A4A] last:border-0 pb-6 last:pb-0 group">
                      <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white dark:bg-[#111C3A] border-2 border-[#1E4A8A] dark:border-[#4A8AC8]" />
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[10px] font-black text-[#1E4A8A] dark:text-[#4A8AC8] uppercase tracking-widest">{format(record.date, "MMM dd, yyyy")}</p>
                          <h4 className="font-bold text-[#1A2A4A] dark:text-[#E8EEF8] mt-1">{record.diagnosis}</h4>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <PrintHistoryButton record={record} patient={appointment.patient} doctorName={record.doctor.user.name} />
                        </div>
                      </div>
                      <p className="text-xs text-[#5A6E8A] dark:text-[#8A9CBA] mt-2 line-clamp-3">{record.prescription}</p>
                      <p className="text-[10px] text-[#5A6E8A]/80 dark:text-[#8A9CBA]/80 font-bold mt-2">By Dr. {record.doctor.user.name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-[#1A2A4A] dark:bg-[#0A122A] p-8 rounded-[2.5rem] border border-[#D0DCE8] dark:border-[#1A2A4A] text-white">
              <h3 className="font-bold mb-4 text-white dark:text-[#E8EEF8]">Patient Contact</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-white/70 dark:text-[#8A9CBA] text-sm">
                  <User size={16} />
                  {appointment.patient.user.email}
                </div>
                <div className="flex items-center gap-3 text-white/70 dark:text-[#8A9CBA] text-sm">
                  <User size={16} />
                  {appointment.patient.user.phone}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
