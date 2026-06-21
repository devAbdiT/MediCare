"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Building2, AlertTriangle, FileText, Share2 } from "lucide-react";

export default function ReferralForm({ appointmentId, patientId }: { appointmentId: string, patientId: string }) {
  const [targetType, setTargetType] = useState<"DOCTOR" | "DEPARTMENT">("DOCTOR");
  const [doctors, setDoctors] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [docsRes, deptsRes] = await Promise.all([
          fetch("/api/doctors"),
          fetch("/api/departments")
        ]);
        if (docsRes.ok) setDoctors(await docsRes.json());
        if (deptsRes.ok) setDepartments(await deptsRes.json());
      } catch (err) {
        console.error("Failed to fetch referral targets", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    const data = {
      appointmentId,
      patientId,
      reason: formData.get("reason"),
      urgency: formData.get("urgency"),
      notes: formData.get("notes"),
      toDoctorId: targetType === "DOCTOR" ? formData.get("toDoctorId") : null,
      toDepartmentId: targetType === "DEPARTMENT" ? formData.get("toDepartmentId") : null,
    };

    try {
      const res = await fetch("/api/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Failed to submit referral");
      
      alert("Referral successfully submitted!");
      e.currentTarget.reset();
      router.refresh();
    } catch (err) {
      alert("Error submitting referral. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-white dark:bg-[#111C3A] rounded-[2.5rem] border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-sm p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 rounded-2xl">
          <Share2 size={24} />
        </div>
        <div>
          <h3 className="font-black text-xl text-[#1A2A4A] dark:text-[#E8EEF8] tracking-tight">Refer Patient</h3>
          <p className="text-sm text-[#5A6E8A] dark:text-[#8A9CBA]">Transfer care to another specialist or department.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Target Type Selection */}
        <div className="flex gap-4 p-1.5 bg-[#F0F4F8] dark:bg-[#0A122A] rounded-2xl w-fit">
          <button
            type="button"
            onClick={() => setTargetType("DOCTOR")}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              targetType === "DOCTOR" 
                ? "bg-white dark:bg-[#1A2A4A] text-[#1E4A8A] dark:text-[#4A8AC8] shadow-sm" 
                : "text-[#5A6E8A] dark:text-[#8A9CBA] hover:text-[#1A2A4A] dark:hover:text-[#E8EEF8]"
            }`}
          >
            <User size={16} /> Specific Doctor
          </button>
          <button
            type="button"
            onClick={() => setTargetType("DEPARTMENT")}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              targetType === "DEPARTMENT" 
                ? "bg-white dark:bg-[#1A2A4A] text-[#1E4A8A] dark:text-[#4A8AC8] shadow-sm" 
                : "text-[#5A6E8A] dark:text-[#8A9CBA] hover:text-[#1A2A4A] dark:hover:text-[#E8EEF8]"
            }`}
          >
            <Building2 size={16} /> Department
          </button>
        </div>

        {/* Target Dropdown */}
        <div className="space-y-2">
          <label className="text-xs font-black text-[#1A2A4A] dark:text-[#E8EEF8] uppercase tracking-widest">
            {targetType === "DOCTOR" ? "Select Specialist" : "Select Department"}
          </label>
          {loading ? (
            <div className="w-full h-12 bg-[#F0F4F8] dark:bg-[#0A122A] animate-pulse rounded-2xl border border-[#D0DCE8] dark:border-[#1A2A4A]"></div>
          ) : targetType === "DOCTOR" ? (
            <select 
              name="toDoctorId" 
              required 
              className="w-full px-4 py-3 bg-white dark:bg-[#111C3A] border border-[#D0DCE8] dark:border-[#1A2A4A] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#1E4A8A] dark:focus:ring-[#4A8AC8] dark:text-white"
            >
              <option value="">-- Choose Doctor --</option>
              {doctors.map(doc => (
                <option key={doc.id} value={doc.id}>
                  Dr. {doc.user.name} ({doc.specialization})
                </option>
              ))}
            </select>
          ) : (
            <select 
              name="toDepartmentId" 
              required 
              className="w-full px-4 py-3 bg-white dark:bg-[#111C3A] border border-[#D0DCE8] dark:border-[#1A2A4A] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#1E4A8A] dark:focus:ring-[#4A8AC8] dark:text-white"
            >
              <option value="">-- Choose Department --</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Reason */}
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-black text-[#1A2A4A] dark:text-[#E8EEF8] uppercase tracking-widest flex items-center gap-2">
              <FileText size={14} className="text-[#1E4A8A] dark:text-[#4A8AC8]" /> Clinical Reason
            </label>
            <textarea 
              name="reason" 
              required 
              rows={2}
              placeholder="Primary reason for referral..."
              className="w-full px-4 py-3 bg-white dark:bg-[#111C3A] border border-[#D0DCE8] dark:border-[#1A2A4A] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#1E4A8A] dark:focus:ring-[#4A8AC8] dark:text-white"
            />
          </div>

          {/* Urgency */}
          <div className="space-y-2">
            <label className="text-xs font-black text-[#1A2A4A] dark:text-[#E8EEF8] uppercase tracking-widest flex items-center gap-2">
              <AlertTriangle size={14} className="text-[#1E4A8A] dark:text-[#4A8AC8]" /> Urgency Level
            </label>
            <select 
              name="urgency" 
              required 
              className="w-full px-4 py-3 bg-white dark:bg-[#111C3A] border border-[#D0DCE8] dark:border-[#1A2A4A] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#1E4A8A] dark:focus:ring-[#4A8AC8] dark:text-white"
            >
              <option value="ROUTINE">🟢 Routine</option>
              <option value="URGENT">🟠 Urgent</option>
              <option value="EMERGENCY">🔴 Emergency</option>
            </select>
          </div>

          {/* Notes */}
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-black text-[#1A2A4A] dark:text-[#E8EEF8] uppercase tracking-widest">
              Additional Notes (Optional)
            </label>
            <textarea 
              name="notes" 
              rows={2}
              placeholder="Any additional instructions or context..."
              className="w-full px-4 py-3 bg-white dark:bg-[#111C3A] border border-[#D0DCE8] dark:border-[#1A2A4A] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#1E4A8A] dark:focus:ring-[#4A8AC8] dark:text-white"
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={submitting}
          className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-2xl transition-all shadow-sm shadow-teal-500/20 disabled:opacity-50 flex justify-center items-center gap-2"
        >
          {submitting ? "Sending Referral..." : "Submit Referral Request"}
        </button>
      </form>
    </div>
  );
}
