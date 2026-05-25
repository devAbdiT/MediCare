// app/dashboard/doctor/patients/PatientsListClient.tsx
"use client";

import React, { useState } from "react";
import {
  User,
  ClipboardList,
  X,
  FileText,
  Calendar,
  Pill,
  Stethoscope,
  Loader2,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface PatientData {
  id: string;
  cardNumber: string | null;
  user: {
    name: string;
    email: string;
    phone: string | null;
  };
  appointmentCount: number;
  lastVisit: string | null;
}

interface MedicalRecord {
  id: string;
  diagnosis: string;
  prescription: string;
  notes: string | null;
  date: string;
  doctor: {
    user: {
      name: string;
    };
  };
}

export default function PatientsListClient({ patients }: { patients: PatientData[] }) {
  const [selectedPatient, setSelectedPatient] = useState<PatientData | null>(null);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [recordsError, setRecordsError] = useState<string | null>(null);

  const handleViewRecords = async (patient: PatientData) => {
    setSelectedPatient(patient);
    setLoadingRecords(true);
    setRecordsError(null);
    setRecords([]);

    try {
      const res = await fetch(`/api/medical-records/${patient.id}`);

      if (res.status === 403) {
        setRecordsError("Access denied. You can only view records for patients you have treated.");
        return;
      }

      if (!res.ok) {
        throw new Error("Failed to fetch records");
      }

      const data = await res.json();
      setRecords(data);
    } catch (err) {
      setRecordsError("Failed to load medical records. Please try again.");
    } finally {
      setLoadingRecords(false);
    }
  };

  const closeModal = () => {
    setSelectedPatient(null);
    setRecords([]);
    setRecordsError(null);
  };

  return (
    <>
      {/* Patients List */}
      {patients.length > 0 ? (
        <div className="space-y-4">
          {patients.map((patient) => (
            <div
              key={patient.id}
              className="p-6 rounded-3xl bg-[#F0F4F8] dark:bg-[#0A122A] border border-[#D0DCE8] dark:border-[#1A2A4A] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-[#1E4A8A] dark:hover:border-[#4A8AC8] transition-all duration-300"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-[#1E4A8A]/10 dark:bg-[#4A8AC8]/10 text-[#1E4A8A] dark:text-[#4A8AC8] rounded-2xl flex items-center justify-center font-black text-xl">
                  {patient.user.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#1A2A4A] dark:text-[#E8EEF8]">
                    {patient.user.name}
                  </h3>
                  <p className="text-sm font-medium text-[#5A6E8A] dark:text-[#8A9CBA]">
                    {patient.user.email}
                    {patient.user.phone && ` • ${patient.user.phone}`}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="inline-block px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-lg">
                      Card: {patient.cardNumber || "N/A"}
                    </span>
                    <span className="text-xs font-bold text-[#5A6E8A] dark:text-[#8A9CBA]">
                      {patient.appointmentCount} visit{patient.appointmentCount !== 1 ? "s" : ""}
                    </span>
                    {patient.lastVisit && (
                      <span className="text-xs font-medium text-[#5A6E8A]/70 dark:text-[#8A9CBA]/70">
                        Last: {format(new Date(patient.lastVisit), "MMM dd, yyyy")}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleViewRecords(patient)}
                className="w-full md:w-auto px-6 py-3 bg-[#1E4A8A] dark:bg-[#4A8AC8] hover:bg-[#0F3A6A] dark:hover:bg-[#3B72A8] text-white dark:text-[#0A122A] rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#1E4A8A]/10 dark:shadow-none"
              >
                <ClipboardList size={16} />
                View Records
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <User size={48} className="mx-auto text-[#D0DCE8] dark:text-[#1A2A4A] mb-4" />
          <p className="text-[#5A6E8A] dark:text-[#8A9CBA] font-bold text-lg">
            No patients found.
          </p>
          <p className="text-[#5A6E8A]/60 dark:text-[#8A9CBA]/60 font-medium text-sm mt-1">
            Patients will appear here once you have appointments with them.
          </p>
        </div>
      )}

      {/* Medical Records Modal */}
      {selectedPatient && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="bg-white dark:bg-[#111C3A] rounded-[2.5rem] border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-8 border-b border-[#F0F4F8] dark:border-[#0A122A] bg-[#F0F4F8] dark:bg-[#0A122A] flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-[#1E4A8A] dark:bg-[#4A8AC8] rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <FileText size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-[#1A2A4A] dark:text-[#E8EEF8] tracking-tight">
                    Medical Records
                  </h2>
                  <p className="text-sm font-medium text-[#5A6E8A] dark:text-[#8A9CBA]">
                    {selectedPatient.user.name} — {selectedPatient.cardNumber || "No Card"}
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="w-12 h-12 rounded-2xl bg-white dark:bg-[#111C3A] border border-[#D0DCE8] dark:border-[#1A2A4A] flex items-center justify-center text-[#5A6E8A] dark:text-[#8A9CBA] hover:text-red-500 dark:hover:text-red-400 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar">
              {loadingRecords && (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <Loader2 size={32} className="animate-spin text-[#1E4A8A] dark:text-[#4A8AC8]" />
                  <p className="text-sm font-bold text-[#5A6E8A] dark:text-[#8A9CBA]">
                    Loading medical records...
                  </p>
                </div>
              )}

              {recordsError && (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center">
                    <AlertTriangle size={32} className="text-red-500" />
                  </div>
                  <p className="text-sm font-bold text-red-500 text-center max-w-md">
                    {recordsError}
                  </p>
                </div>
              )}

              {!loadingRecords && !recordsError && records.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <div className="w-16 h-16 bg-[#1E4A8A]/10 dark:bg-[#4A8AC8]/10 rounded-2xl flex items-center justify-center">
                    <ShieldCheck size={32} className="text-[#1E4A8A] dark:text-[#4A8AC8]" />
                  </div>
                  <p className="text-sm font-bold text-[#5A6E8A] dark:text-[#8A9CBA]">
                    No medical records found for this patient.
                  </p>
                </div>
              )}

              {!loadingRecords &&
                !recordsError &&
                records.map((record) => (
                  <div
                    key={record.id}
                    className="p-6 bg-[#F0F4F8] dark:bg-[#0A122A] rounded-[2rem] border border-[#D0DCE8] dark:border-[#1A2A4A] space-y-4 hover:border-[#1E4A8A]/30 dark:hover:border-[#4A8AC8]/30 transition-colors"
                  >
                    {/* Date header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-[#1E4A8A] dark:text-[#4A8AC8]" />
                        <span className="text-xs font-black text-[#1E4A8A] dark:text-[#4A8AC8] uppercase tracking-widest">
                          {format(new Date(record.date), "MMMM dd, yyyy")}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-widest">
                        Dr. {record.doctor.user.name}
                      </span>
                    </div>

                    {/* Diagnosis */}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Stethoscope size={14} className="text-[#5A6E8A] dark:text-[#8A9CBA]" />
                        <span className="text-[10px] font-black text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-widest">
                          Diagnosis
                        </span>
                      </div>
                      <p className="text-sm font-bold text-[#1A2A4A] dark:text-[#E8EEF8] ml-6">
                        {record.diagnosis}
                      </p>
                    </div>

                    {/* Prescription */}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Pill size={14} className="text-[#5A6E8A] dark:text-[#8A9CBA]" />
                        <span className="text-[10px] font-black text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-widest">
                          Prescription
                        </span>
                      </div>
                      <p className="text-sm font-bold text-[#1A2A4A] dark:text-[#E8EEF8] ml-6">
                        {record.prescription}
                      </p>
                    </div>

                    {/* Notes */}
                    {record.notes && (
                      <div className="ml-6 mt-2 pl-4 border-l-2 border-[#D0DCE8] dark:border-[#1A2A4A]">
                        <p className="text-xs font-medium text-[#5A6E8A] dark:text-[#8A9CBA] italic">
                          {record.notes}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-[#F0F4F8] dark:border-[#0A122A] bg-[#F0F4F8]/50 dark:bg-[#0A122A]/50 flex-shrink-0">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-[#5A6E8A] dark:text-[#8A9CBA]">
                  {records.length} record{records.length !== 1 ? "s" : ""} found
                </p>
                <button
                  onClick={closeModal}
                  className="px-6 py-3 bg-[#1A2A4A] dark:bg-[#1A2A4A] hover:bg-[#1E4A8A] dark:hover:bg-[#4A8AC8] text-white rounded-xl font-bold text-sm transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
