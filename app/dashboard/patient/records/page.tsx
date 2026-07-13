// app/dashboard/patient/records/page.tsx
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import prisma from "@/lib/prisma";
import { format } from "date-fns";
import { Clipboard, FileText, Pill, Calendar, User, FlaskConical, AlertCircle, CheckCircle, Download } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default async function PatientRecordsPage({ searchParams }: { searchParams: any }) {
  const resolvedSearchParams = await searchParams;
  const currentTab = resolvedSearchParams?.tab || "medical";
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
      },
      labOrders: {
        where: { status: "RESULTED" },
        include: {
          doctor: { include: { user: { select: { name: true } } } },
          result: true
        },
        orderBy: { orderedAt: "desc" }
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

        <div className="flex items-center gap-4 border-b border-[#E2E8F0] dark:border-[#334155] mb-8">
          <Link
            href="?tab=medical"
            className={cn(
              "px-6 py-4 font-bold text-sm uppercase tracking-widest border-b-2 transition-colors",
              currentTab === "medical"
                ? "border-[#3B82F6] text-[#3B82F6]"
                : "border-transparent text-[#64748B] dark:text-[#94A3B8] hover:text-[#1E293B] dark:hover:text-[#F1F5F9]"
            )}
          >
            Medical Records
          </Link>
          <Link
            href="?tab=lab"
            className={cn(
              "px-6 py-4 font-bold text-sm uppercase tracking-widest border-b-2 transition-colors",
              currentTab === "lab"
                ? "border-[#3B82F6] text-[#3B82F6]"
                : "border-transparent text-[#64748B] dark:text-[#94A3B8] hover:text-[#1E293B] dark:hover:text-[#F1F5F9]"
            )}
          >
            Lab Results
          </Link>
        </div>

        {currentTab === "medical" && (
          patient?.medicalRecords.length === 0 ? (
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
          )
        )}

        {currentTab === "lab" && (
          (!patient?.labOrders || patient.labOrders.length === 0) ? (
            <div className="text-center py-20 bg-white dark:bg-[#1E293B] rounded-[2.5rem] border-2 border-dashed border-[#E2E8F0] dark:border-[#334155]">
              <FlaskConical size={48} className="mx-auto text-[#E2E8F0] dark:text-[#334155] mb-4" />
              <p className="text-[#64748B] dark:text-[#94A3B8] font-bold">No lab results yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {patient.labOrders.map((order) => {
                const result = order.result;
                if (!result) return null;
                const isAbnormal = result.isAbnormal;

                return (
                  <div key={order.id} className="bg-white dark:bg-[#1E293B] rounded-[2.5rem] border border-[#E2E8F0] dark:border-[#334155] shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-lg">
                    <div className="p-8 border-b border-[#E2E8F0] dark:border-[#334155] flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-black text-[#1E293B] dark:text-[#F1F5F9] mb-1">{order.testName}</h3>
                        <p className="text-xs font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-widest">
                          Ordered {format(order.orderedAt, "MMM dd, yyyy")} • Dr. {order.doctor.user.name}
                        </p>
                      </div>
                      {isAbnormal ? (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full border border-red-200 dark:border-red-900/50">
                          <AlertCircle size={14} strokeWidth={3} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Abnormal</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full border border-green-200 dark:border-green-900/50">
                          <CheckCircle size={14} strokeWidth={3} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Normal</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-8 flex-1 bg-[#F8FAFC] dark:bg-[#0F172A] flex flex-col justify-center items-center text-center">
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-5xl font-black text-[#1E293B] dark:text-[#F1F5F9] tracking-tighter">
                          {result.resultValue}
                        </span>
                        {result.unit && (
                          <span className="text-lg font-bold text-[#64748B] dark:text-[#94A3B8]">{result.unit}</span>
                        )}
                      </div>
                      {result.referenceRange && (
                        <p className="text-xs font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-widest">
                          Ref: {result.referenceRange}
                        </p>
                      )}
                    </div>
                    
                    {(result.interpretation || order.id) && (
                      <div className="p-8 bg-white dark:bg-[#1E293B] flex flex-col gap-6">
                        {result.interpretation && (
                          <div>
                            <p className="text-[10px] font-black text-[#64748B] dark:text-[#94A3B8] uppercase tracking-widest mb-2">Notes</p>
                            <p className="text-sm font-medium text-[#1E293B] dark:text-[#F1F5F9]">{result.interpretation}</p>
                          </div>
                        )}
                        <a
                          href={`/api/print/lab/${order.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center gap-2 w-full py-4 bg-[#F0F4F8] dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-xl text-[#3B82F6] dark:text-[#60A5FA] font-bold text-sm uppercase tracking-widest hover:bg-[#3B82F6] hover:text-white dark:hover:bg-[#3B82F6] dark:hover:text-white transition-all"
                        >
                          <Download size={16} />
                          Download Report
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </DashboardLayout>
  );
}
