// app/dashboard/patient/records/page.tsx
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import prisma from "@/lib/prisma";
import { format } from "date-fns";
import { Clipboard, FileText, Pill, Calendar, User } from "lucide-react";

export default async function PatientRecordsPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session || (session.user as any).role !== "PATIENT") {
    redirect("/login");
  }

  const patient = await prisma.patient.findUnique({
    where: { userId: session.user.id },
    include: {
      medicalRecords: {
        include: { doctor: { include: { user: { select: { name: true } } } } },
        orderBy: { date: "desc" }
      }
    }
  });

  return (
    <DashboardLayout role="patient">
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Medical Records</h1>
          <p className="text-slate-500 mt-2 text-lg font-medium">Your complete health history at MediCare</p>
        </div>

        {patient?.medicalRecords.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100">
            <Clipboard size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-400 font-bold">No medical records available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8">
            {patient?.medicalRecords.map((record) => (
              <div key={record.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 transition-all flex flex-col md:flex-row">
                <div className="bg-slate-50 p-8 md:w-64 flex flex-col justify-center items-center text-center border-b md:border-b-0 md:border-r border-slate-100">
                  <Calendar size={32} className="text-blue-600 mb-3" />
                  <p className="text-xl font-black text-slate-900">{format(record.date, "dd MMM")}</p>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{format(record.date, "yyyy")}</p>
                  <div className="mt-6 flex items-center gap-2 text-xs font-bold text-slate-500">
                    <User size={14} />
                    Dr. {record.doctor.user.name}
                  </div>
                </div>
                
                <div className="p-10 flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                      <FileText size={16} className="text-blue-600" />
                      Diagnosis
                    </div>
                    <p className="text-lg font-bold text-slate-900 leading-relaxed">{record.diagnosis}</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                      <Pill size={16} className="text-emerald-500" />
                      Prescription
                    </div>
                    <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-50">
                      <p className="text-emerald-900 font-medium whitespace-pre-wrap text-sm leading-relaxed">{record.prescription}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
