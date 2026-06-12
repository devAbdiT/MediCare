"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileText, Pill, Loader2, Save, Printer, Calendar as CalendarIcon, Clock, CheckCircle2 } from "lucide-react";
import { format, differenceInYears } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface RecordFormProps {
  appointment: any;
}

export function printPrescription(record: any, patient: any, doctorName: string) {
  const age = differenceInYears(new Date(), new Date(patient.dateOfBirth));
  const dateStr = format(new Date(record.date || new Date()), "MMM dd, yyyy");
  
  const html = `
    <html>
      <head>
        <title>Prescription - ${patient.user.name}</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #1e293b; max-width: 800px; margin: 0 auto; line-height: 1.6; }
          .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; mb-6; display: flex; justify-content: space-between; align-items: flex-end; }
          .hospital-name { font-size: 24px; font-weight: 900; color: #0f172a; margin: 0; }
          .hospital-sub { font-size: 12px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 2px; }
          .date { font-size: 14px; color: #64748b; font-weight: 500; }
          .patient-info { display: flex; flex-wrap: wrap; gap: 20px; background: #f8fafc; padding: 20px; border-radius: 12px; margin-top: 30px; margin-bottom: 30px; }
          .info-block { flex: 1; min-width: 120px; }
          .info-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; font-weight: bold; margin-bottom: 4px; }
          .info-value { font-size: 16px; font-weight: 700; color: #0f172a; }
          .rx-symbol { font-size: 48px; font-family: serif; color: #0f172a; margin-bottom: 20px; line-height: 1; }
          .section { margin-bottom: 30px; }
          .section-title { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; font-weight: bold; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 12px; }
          .section-content { font-size: 16px; color: #0f172a; white-space: pre-wrap; }
          .footer { margin-top: 60px; padding-top: 20px; border-top: 2px solid #e2e8f0; display: flex; justify-content: flex-end; }
          .signature-block { text-align: right; }
          .signature-line { width: 200px; border-bottom: 1px solid #0f172a; margin-bottom: 8px; margin-left: auto; }
          .doctor-name { font-weight: bold; font-size: 16px; color: #0f172a; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="hospital-name">MediCare</h1>
            <div class="hospital-sub">Cloud OS</div>
          </div>
          <div class="date">Date: ${dateStr}</div>
        </div>

        <div class="patient-info">
          <div class="info-block">
            <div class="info-label">Patient Name</div>
            <div class="info-value">${patient.user.name}</div>
          </div>
          <div class="info-block">
            <div class="info-label">Age / DOB</div>
            <div class="info-value">${age} Yrs (${format(new Date(patient.dateOfBirth), "MM/dd/yyyy")})</div>
          </div>
          <div class="info-block">
            <div class="info-label">Blood Type</div>
            <div class="info-value">${patient.bloodType || "N/A"}</div>
          </div>
        </div>

        <div class="rx-symbol">℞</div>

        <div class="section">
          <div class="section-title">Clinical Diagnosis</div>
          <div class="section-content">${record.diagnosis}</div>
        </div>

        <div class="section">
          <div class="section-title">Prescription & Treatment</div>
          <div class="section-content">${record.prescription}</div>
        </div>

        <div class="footer">
          <div class="signature-block">
            <div class="signature-line"></div>
            <div class="doctor-name">Dr. ${doctorName}</div>
            <div class="info-label" style="margin-top: 4px;">Authorized Signature</div>
          </div>
        </div>
      </body>
    </html>
  `;

  const printWin = window.open('', '_blank', 'width=800,height=800');
  if (printWin) {
    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => {
      printWin.print();
      printWin.close();
    }, 250);
  }
}

import PrescriptionBuilder from "@/components/doctor/PrescriptionBuilder";

export default function RecordForm({ appointment }: RecordFormProps) {
  const router = useRouter();
  
  // Record Form State
  const [diagnosis, setDiagnosis] = useState("");
  const [prescriptionItems, setPrescriptionItems] = useState<any[]>([
    { drugName: "", dose: "", frequency: "Once daily", duration: "", route: "Oral", quantity: "", instructions: "" }
  ]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [savedRecord, setSavedRecord] = useState<any>(null);

  // Follow-up Form State
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpTime, setFollowUpTime] = useState("");
  const [followUpLoading, setFollowUpLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const activeItems = prescriptionItems.filter(item => item.drugName && item.dose && item.duration);
    if (activeItems.length === 0) {
      toast.error("Please add at least one valid drug with Dose and Duration");
      setLoading(false);
      return;
    }

    const prescriptionSummary = activeItems
      .map(item => `${item.drugName} ${item.dose} (${item.route}) - ${item.frequency} for ${item.duration}`)
      .join("\n");

    try {
      const res = await fetch("/api/medical-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: appointment.id,
          patientId: appointment.patientId,
          doctorId: appointment.doctorId,
          diagnosis,
          prescription: prescriptionSummary,
          notes,
        }),
      });

      if (res.ok) {
        const record = await res.json();

        // Save structured prescription items
        await fetch("/api/prescriptions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            medicalRecordId: record.id,
            items: activeItems
          })
        });

        setSavedRecord({ ...record, diagnosis, prescription: prescriptionSummary }); // Keep data for printing
        toast.success("Medical record and prescriptions saved successfully!");
      } else {
        const error = await res.json();
        toast.error(error.message || "Failed to save record");
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setFollowUpLoading(true);

    try {
      const dateTime = new Date(`${followUpDate}T${followUpTime}`).toISOString();
      const res = await fetch("/api/appointments/follow-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: appointment.patientId,
          doctorId: appointment.doctorId,
          dateTime,
          reason: "Follow-up",
        }),
      });

      if (res.ok) {
        toast.success("Follow-up appointment scheduled!");
        setFollowUpOpen(false);
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to schedule follow-up");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setFollowUpLoading(false);
    }
  };

  const onPrint = () => {
    if (savedRecord) {
      window.open(`/api/print/prescription/${savedRecord.id}`, '_blank');
    }
  };

  if (savedRecord) {
    return (
      <div className="bg-white dark:bg-[#111C3A] p-10 rounded-[3rem] border border-emerald-500/20 dark:border-emerald-500/20 shadow-sm flex flex-col items-center text-center space-y-6">
        <div className="w-20 h-20 bg-emerald-500/10 dark:bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 dark:text-[#34D399] mb-2">
          <CheckCircle2 size={40} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-[#1A2A4A] dark:text-[#E8EEF8] tracking-tight">Appointment Completed</h2>
          <p className="text-[#5A6E8A] dark:text-[#8A9CBA] mt-2 font-medium max-w-md mx-auto">
            The medical record has been securely saved to the patient's vault.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md pt-4">
          <button
            onClick={onPrint}
            className="flex-1 py-4 bg-[#F0F4F8] dark:bg-[#0A122A] text-[#5A6E8A] dark:text-[#8A9CBA] hover:text-[#1E4A8A] dark:hover:text-[#4A8AC8] rounded-2xl font-black transition-colors flex items-center justify-center gap-2 border border-[#D0DCE8] dark:border-[#1A2A4A]"
          >
            <Printer size={20} />
            Print Prescription
          </button>
          
          <button
            onClick={() => setFollowUpOpen(true)}
            className="flex-1 py-4 bg-[#1E4A8A]/10 dark:bg-[#4A8AC8]/10 text-[#1E4A8A] dark:text-[#4A8AC8] hover:bg-[#1E4A8A]/20 dark:hover:bg-[#4A8AC8]/20 rounded-2xl font-black transition-colors flex items-center justify-center gap-2"
          >
            <CalendarIcon size={20} />
            Follow-up Visit
          </button>
        </div>

        <button
          onClick={() => router.push("/dashboard/doctor")}
          className="text-[#5A6E8A] dark:text-[#8A9CBA] font-bold hover:text-[#1E4A8A] dark:hover:text-[#4A8AC8] underline underline-offset-4 mt-4"
        >
          Return to Dashboard
        </button>

        {/* Follow-up Modal */}
        <Dialog open={followUpOpen} onOpenChange={setFollowUpOpen}>
          <DialogContent className="sm:max-w-md rounded-[2.5rem] p-8 bg-white dark:bg-[#111C3A] border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-[#1A2A4A] dark:text-[#E8EEF8]">Give Follow-up</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleFollowUp} className="space-y-6 mt-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-widest ml-1">Patient</label>
                <div className="w-full p-4 bg-[#F0F4F8] dark:bg-[#0A122A] rounded-2xl font-bold text-[#5A6E8A] dark:text-[#8A9CBA]">
                  {appointment.patient.user.name}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-widest ml-1">Date</label>
                <input
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full p-4 bg-[#F0F4F8] dark:bg-[#0A122A] border-2 border-[#D0DCE8] dark:border-[#1A2A4A] rounded-2xl focus:bg-white dark:focus:bg-[#111C3A] focus:border-[#1E4A8A] dark:focus:border-[#4A8AC8] outline-none transition-all font-bold text-[#1A2A4A] dark:text-[#E8EEF8]"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-widest ml-1">Time Slot</label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5A6E8A] dark:text-[#8A9CBA]" size={18} />
                  <select
                    value={followUpTime}
                    onChange={(e) => setFollowUpTime(e.target.value)}
                    className="w-full pl-12 pr-4 h-14 bg-[#F0F4F8] dark:bg-[#0A122A] border-2 border-[#D0DCE8] dark:border-[#1A2A4A] rounded-2xl focus:bg-white dark:focus:bg-[#111C3A] focus:border-[#1E4A8A] dark:focus:border-[#4A8AC8] outline-none transition-all font-bold text-[#1A2A4A] dark:text-[#E8EEF8] appearance-none"
                    required
                  >
                    <option value="">Select time...</option>
                    {Array.from({ length: 9 }, (_, i) => i + 9).map(hour => {
                      const formattedHour = hour < 10 ? `0${hour}` : hour;
                      const label = hour > 12 ? `${hour - 12}:00 PM` : hour === 12 ? `12:00 PM` : `${hour}:00 AM`;
                      return (
                        <option key={hour} value={`${formattedHour}:00:00`}>{label}</option>
                      );
                    })}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-widest ml-1">Reason</label>
                <input
                  type="text"
                  value="Follow-up"
                  disabled
                  className="w-full p-4 bg-[#F0F4F8] dark:bg-[#0A122A] border border-[#D0DCE8] dark:border-[#1A2A4A] rounded-2xl font-bold text-[#5A6E8A] dark:text-[#8A9CBA]"
                />
              </div>
              <button
                type="submit"
                disabled={followUpLoading || !followUpDate || !followUpTime}
                className="w-full py-4 bg-[#1E4A8A] dark:bg-[#4A8AC8] text-white dark:text-[#0A122A] rounded-2xl font-black hover:bg-[#1A3F75] dark:hover:bg-[#3B72A8] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {followUpLoading ? <Loader2 className="animate-spin" /> : <CalendarIcon size={20} />}
                Confirm Follow-up
              </button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-[#111C3A] p-10 rounded-[3rem] border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-sm space-y-8">
      <div className="space-y-4">
        <label className="flex items-center gap-2 text-sm font-black text-[#1A2A4A] dark:text-[#E8EEF8] uppercase tracking-widest">
          <FileText size={18} className="text-[#1E4A8A] dark:text-[#4A8AC8]" />
          Diagnosis
        </label>
        <textarea
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
          placeholder="Enter clinical diagnosis..."
          className="w-full p-6 bg-[#F0F4F8] dark:bg-[#0A122A] border-2 border-[#D0DCE8] dark:border-[#1A2A4A] rounded-3xl focus:bg-white dark:focus:bg-[#111C3A] focus:border-[#1E4A8A] dark:focus:border-[#4A8AC8] outline-none transition-all font-medium text-[#1A2A4A] dark:text-[#E8EEF8] min-h-[120px] resize-none"
          required
        />
      </div>

      <div className="space-y-4">
        <label className="flex items-center gap-2 text-sm font-black text-[#1A2A4A] dark:text-[#E8EEF8] uppercase tracking-widest">
          <Pill size={18} className="text-emerald-500 dark:text-[#34D399]" />
          Prescription & Treatment
        </label>
        <PrescriptionBuilder onChange={setPrescriptionItems} />
      </div>

      <div className="space-y-4">
        <label className="text-sm font-black text-[#1A2A4A] dark:text-[#E8EEF8] uppercase tracking-widest">Internal Notes (Optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Private notes for medical staff..."
          className="w-full p-6 bg-[#F0F4F8] dark:bg-[#0A122A] border-2 border-[#D0DCE8] dark:border-[#1A2A4A] rounded-3xl focus:bg-white dark:focus:bg-[#111C3A] focus:border-[#5A6E8A] dark:focus:border-[#8A9CBA] outline-none transition-all font-medium text-[#1A2A4A] dark:text-[#E8EEF8] min-h-[100px] resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-6 bg-[#1E4A8A] dark:bg-[#4A8AC8] text-white dark:text-[#0A122A] rounded-3xl font-black text-xl shadow-lg shadow-[#1E4A8A]/10 dark:shadow-[#4A8AC8]/10 hover:bg-[#1A3F75] dark:hover:bg-[#3B72A8] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
      >
        {loading ? <Loader2 className="animate-spin" /> : <Save />}
        Complete Appointment
      </button>
    </form>
  );
}
