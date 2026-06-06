// app/dashboard/doctor/profile/DoctorProfileForm.tsx
"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import {
  User, Phone, Stethoscope, FileText, BadgeCheck,
  DollarSign, Image as ImageIcon, Loader2, Save, Building2
} from "lucide-react";

interface DoctorData {
  id: string;
  specialization: string;
  bio: string | null;
  profilePhoto: string | null;
  licenseNumber: string | null;
  qualifications: string | null;
  consultationFee: number | null;
  department: { id: string; name: string; consultationFee: number } | null;
  user: { id: string; name: string; email: string; phone: string | null };
}

export default function DoctorProfileForm({ doctor }: { doctor: DoctorData }) {
  const [form, setForm] = useState({
    specialization: doctor.specialization || "",
    bio: doctor.bio || "",
    profilePhoto: doctor.profilePhoto || "",
    licenseNumber: doctor.licenseNumber || "",
    qualifications: doctor.qualifications || "",
    consultationFee: doctor.consultationFee?.toString() || "",
  });

  const [imgError, setImgError] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/doctors/${doctor.id}/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          specialization: form.specialization,
          bio: form.bio,
          profilePhoto: form.profilePhoto,
          licenseNumber: form.licenseNumber,
          qualifications: form.qualifications,
        }),
      });

      if (res.ok) {
        toast.success("Profile updated successfully!");
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to update profile");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  const isValidImageUrl = form.profilePhoto && !imgError;

  return (
    <div className="space-y-10 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-1.5 h-8 bg-[#1E4A8A] dark:bg-[#4A8AC8] rounded-full" />
            <h1 className="text-4xl font-black text-[#1A2A4A] dark:text-[#E8EEF8] tracking-tight">
              My Profile
            </h1>
          </div>
          <p className="text-[#5A6E8A] dark:text-[#8A9CBA] font-medium ml-5">
            Manage your professional information and clinical details
          </p>
        </div>

        {/* Quick identity card */}
        <div className="flex items-center gap-4 bg-white dark:bg-[#111C3A] px-6 py-4 rounded-2xl border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-sm">
          <div className="w-14 h-14 rounded-2xl overflow-hidden bg-[#F0F4F8] dark:bg-[#0A122A] flex items-center justify-center shrink-0 border border-[#D0DCE8] dark:border-[#1A2A4A]">
            {isValidImageUrl ? (
              <img
                src={form.profilePhoto}
                alt="Profile"
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <User size={28} className="text-[#1E4A8A] dark:text-[#4A8AC8]" />
            )}
          </div>
          <div>
            <p className="font-black text-[#1A2A4A] dark:text-[#E8EEF8]">{doctor.user.name}</p>
            <p className="text-xs font-bold text-[#5A6E8A] dark:text-[#8A9CBA]">{doctor.specialization}</p>
            {doctor.department && (
              <p className="text-xs text-[#1E4A8A] dark:text-[#4A8AC8] font-bold flex items-center gap-1 mt-0.5">
                <Building2 size={10} />
                {doctor.department.name}
              </p>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Left: Photo Preview ── */}
          <div className="space-y-6">
            <Section title="Profile Photo" icon={<ImageIcon size={16} />}>
              <div className="space-y-4">
                <div className="w-full aspect-square rounded-[2rem] overflow-hidden bg-[#F0F4F8] dark:bg-[#0A122A] border border-[#D0DCE8] dark:border-[#1A2A4A] flex items-center justify-center">
                  {isValidImageUrl ? (
                    <img
                      src={form.profilePhoto}
                      alt="Profile preview"
                      className="w-full h-full object-cover"
                      onError={() => setImgError(true)}
                    />
                  ) : (
                    <div className="text-center">
                      <User size={64} className="text-[#D0DCE8] dark:text-[#1A2A4A] mx-auto" />
                      <p className="text-xs text-[#5A6E8A] dark:text-[#8A9CBA] mt-2 font-medium">No photo set</p>
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black text-[#5A6E8A] uppercase tracking-widest">Photo URL</label>
                  <input
                    type="url"
                    value={form.profilePhoto}
                    onChange={(e) => { setForm(f => ({ ...f, profilePhoto: e.target.value })); setImgError(false); }}
                    placeholder="https://example.com/photo.jpg"
                    className="w-full px-4 py-3 bg-[#F0F4F8] dark:bg-[#0A122A] rounded-xl border border-transparent focus:border-[#1E4A8A] outline-none text-sm font-medium text-[#1A2A4A] dark:text-[#E8EEF8] transition-colors"
                  />
                </div>
              </div>
            </Section>

            {/* Fee info (read-only for doctor) */}
            <div className="bg-[#1E4A8A]/5 dark:bg-[#4A8AC8]/10 border border-[#1E4A8A]/20 dark:border-[#4A8AC8]/30 rounded-2xl p-5 space-y-3">
              <p className="text-xs font-black text-[#1E4A8A] dark:text-[#4A8AC8] uppercase tracking-widest flex items-center gap-1.5">
                <DollarSign size={12} /> Fee Configuration
              </p>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-[#5A6E8A] dark:text-[#8A9CBA]">My Rate</span>
                  <span className="text-sm font-black text-[#1A2A4A] dark:text-[#E8EEF8]">
                    {doctor.consultationFee != null ? `ETB ${doctor.consultationFee.toFixed(2)}` : "—"}
                  </span>
                </div>
                {doctor.department?.consultationFee != null && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-[#5A6E8A] dark:text-[#8A9CBA]">Dept. Default</span>
                    <span className="text-sm font-black text-[#5A6E8A] dark:text-[#8A9CBA]">
                      ETB {doctor.department.consultationFee.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
              <p className="text-[10px] text-[#5A6E8A] dark:text-[#8A9CBA] italic">
                Contact admin to update your consultation fee.
              </p>
            </div>
          </div>

          {/* ── Right: Form Sections ── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal */}
            <Section title="Personal Information" icon={<User size={16} />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Full Name" icon={<User size={14} />}>
                  <input
                    value={doctor.user.name}
                    disabled
                    className="w-full px-4 py-3 bg-[#F0F4F8] dark:bg-[#0A122A] rounded-xl border border-transparent text-sm font-medium text-[#5A6E8A] dark:text-[#8A9CBA] cursor-not-allowed"
                  />
                </Field>
                <Field label="Email" icon={<BadgeCheck size={14} />}>
                  <input
                    value={doctor.user.email}
                    disabled
                    className="w-full px-4 py-3 bg-[#F0F4F8] dark:bg-[#0A122A] rounded-xl border border-transparent text-sm font-medium text-[#5A6E8A] dark:text-[#8A9CBA] cursor-not-allowed"
                  />
                </Field>
                <Field label="Phone" icon={<Phone size={14} />}>
                  <input
                    value={doctor.user.phone || "—"}
                    disabled
                    className="w-full px-4 py-3 bg-[#F0F4F8] dark:bg-[#0A122A] rounded-xl border border-transparent text-sm font-medium text-[#5A6E8A] dark:text-[#8A9CBA] cursor-not-allowed"
                  />
                </Field>
                <Field label="Specialization *" icon={<Stethoscope size={14} />}>
                  <input
                    type="text"
                    value={form.specialization}
                    onChange={(e) => setForm(f => ({ ...f, specialization: e.target.value }))}
                    required
                    className="w-full px-4 py-3 bg-[#F0F4F8] dark:bg-[#0A122A] rounded-xl border border-transparent focus:border-[#1E4A8A] outline-none text-sm font-medium text-[#1A2A4A] dark:text-[#E8EEF8] transition-colors"
                  />
                </Field>
              </div>
            </Section>

            {/* Professional */}
            <Section title="Professional Details" icon={<BadgeCheck size={16} />}>
              <div className="space-y-4">
                <Field label="License Number" icon={<BadgeCheck size={14} />}>
                  <input
                    type="text"
                    value={form.licenseNumber}
                    onChange={(e) => setForm(f => ({ ...f, licenseNumber: e.target.value }))}
                    placeholder="e.g. MD-ET-12345"
                    className="w-full px-4 py-3 bg-[#F0F4F8] dark:bg-[#0A122A] rounded-xl border border-transparent focus:border-[#1E4A8A] outline-none text-sm font-medium text-[#1A2A4A] dark:text-[#E8EEF8] transition-colors"
                  />
                </Field>
                <Field label="Qualifications & Certifications" icon={<FileText size={14} />}>
                  <textarea
                    value={form.qualifications}
                    onChange={(e) => setForm(f => ({ ...f, qualifications: e.target.value }))}
                    placeholder="e.g. MBBS (AAU, 2010), MD Internal Medicine (2015), FCCP..."
                    rows={3}
                    className="w-full px-4 py-3 bg-[#F0F4F8] dark:bg-[#0A122A] rounded-xl border border-transparent focus:border-[#1E4A8A] outline-none text-sm font-medium text-[#1A2A4A] dark:text-[#E8EEF8] resize-none transition-colors"
                  />
                </Field>
              </div>
            </Section>

            {/* Bio */}
            <Section title="Biography" icon={<FileText size={16} />}>
              <textarea
                value={form.bio}
                onChange={(e) => setForm(f => ({ ...f, bio: e.target.value }))}
                placeholder="Write a short professional biography visible to patients and staff..."
                rows={5}
                className="w-full px-4 py-3 bg-[#F0F4F8] dark:bg-[#0A122A] rounded-xl border border-transparent focus:border-[#1E4A8A] outline-none text-sm font-medium text-[#1A2A4A] dark:text-[#E8EEF8] resize-none transition-colors"
              />
              <p className="text-xs text-[#5A6E8A] dark:text-[#8A9CBA] mt-1">{form.bio.length} characters</p>
            </Section>

            {/* Save */}
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-3 px-10 py-4 bg-[#1E4A8A] hover:bg-[#0F3A6A] text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-[#1E4A8A]/20 transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Save Profile
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-[#111C3A] p-7 rounded-[2.5rem] border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-sm transition-colors duration-300">
      <h3 className="text-sm font-black text-[#1A2A4A] dark:text-[#E8EEF8] uppercase tracking-widest flex items-center gap-2 mb-6">
        <span className="text-[#1E4A8A] dark:text-[#4A8AC8]">{icon}</span>
        {title}
      </h3>
      {children}
    </div>
  );
}

function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-black text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-widest flex items-center gap-1.5">
        <span className="text-[#1E4A8A] dark:text-[#4A8AC8]">{icon}</span>
        {label}
      </label>
      {children}
    </div>
  );
}
