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

export default async function AppointmentDetailsPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session || session.user.role !== "DOCTOR") {
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
      doctor: { select: { id: true } }
    }
  });

  if (!appointment) {
    redirect("/dashboard/doctor");
  }

  return (
    <DashboardLayout role="doctor">
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/doctor" className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-blue-600 transition-colors">
            <ChevronLeft size={24} />
          </Link>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Patient Workspace</h1>
            <p className="text-slate-500 font-medium">Managing visit for {appointment.patient.user.name}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Side */}
          <div className="lg:col-span-2 space-y-8">
            <RecordForm 
              appointmentId={appointment.id} 
              patientId={appointment.patientId} 
              doctorId={appointment.doctorId} 
            />
          </div>

          {/* History Side */}
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Clipboard className="text-blue-600" size={20} />
                Medical History
              </h3>
              
              {appointment.patient.medicalRecords.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-slate-400 text-sm font-medium italic">No previous records found.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {appointment.patient.medicalRecords.map((record) => (
                    <div key={record.id} className="relative pl-6 border-l-2 border-slate-100 last:border-0 pb-6 last:pb-0">
                      <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-blue-600" />
                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{format(record.date, "MMM dd, yyyy")}</p>
                      <h4 className="font-bold text-slate-900 mt-1">{record.diagnosis}</h4>
                      <p className="text-xs text-slate-500 mt-2 line-clamp-3">{record.prescription}</p>
                      <p className="text-[10px] text-slate-400 font-bold mt-2">By Dr. {record.doctor.user.name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white">
              <h3 className="font-bold mb-4">Patient Contact</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-white/60 text-sm">
                  <User size={16} />
                  {appointment.patient.user.email}
                </div>
                <div className="flex items-center gap-3 text-white/60 text-sm">
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
