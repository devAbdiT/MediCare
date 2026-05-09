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
      <div className="space-y-8 pb-10">
        <div>
          <h1 className="text-4xl font-black text-[#1E293B] dark:text-[#F1F5F9] tracking-tight">Medical Vault</h1>
          <p className="text-[#64748B] dark:text-[#94A3B8] mt-2 text-lg font-medium">Your complete encrypted health history</p>
        </div>

        {patient?.medicalRecords.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-[#1E293B] rounded-[2.5rem] border-2 border-dashed border-[#E2E8F0] dark:border-[#334155]">
            <Clipboard size={48} className="mx-auto text-[#E2E8F0] dark:text-[#334155] mb-4" />
            <p className="text-[#64748B] dark:text-[#94A3B8] font-bold">No medical records available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8">
            {patient?.medicalRecords.map((record) => (
              <div key={record.id} className="bg-white dark:bg-[#1E293B] rounded-[2.5rem] border border-[#E2E8F0] dark:border-[#334155] shadow-sm overflow-hidden hover:shadow-xl hover:shadow-blue-500/5 transition-all flex flex-col md:flex-row group duration-500">
                <div className="bg-[#F8FAFC] dark:bg-[#0F172A] p-8 md:w-64 flex flex-col justify-center items-center text-center border-b md:border-b-0 md:border-r border-[#E2E8F0] dark:border-[#334155] transition-colors duration-500">
                  <Calendar size={32} className="text-[#3B82F6] dark:text-[#60A5FA] mb-3" />
                  <p className="text-xl font-black text-[#1E293B] dark:text-[#F1F5F9]">{format(record.date, "dd MMM")}</p>
                  <p className="text-sm font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-widest">{format(record.date, "yyyy")}</p>
                  <div className="mt-6 flex items-center gap-2 text-xs font-bold text-[#64748B] dark:text-[#94A3B8]">
                    <User size={14} />
                    Dr. {record.doctor.user.name}
                  </div>
                </div>
                
                <div className="p-10 flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-xs font-black text-[#64748B] dark:text-[#94A3B8] uppercase tracking-widest">
                      <FileText size={16} className="text-[#3B82F6]" />
                      Diagnosis
                    </div>
                    <p className="text-lg font-bold text-[#1E293B] dark:text-[#F1F5F9] leading-relaxed">{record.diagnosis}</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-xs font-black text-[#64748B] dark:text-[#94A3B8] uppercase tracking-widest">
                      <Pill size={16} className="text-[#10B981]" />
                      Prescription
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/10 p-6 rounded-2xl border border-green-100 dark:border-green-900/20">
                      <p className="text-green-900 dark:text-green-400 font-medium whitespace-pre-wrap text-sm leading-relaxed">{record.prescription}</p>
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
