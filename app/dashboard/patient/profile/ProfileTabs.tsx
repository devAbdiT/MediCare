// app/dashboard/patient/profile/ProfileTabs.tsx
"use client";

import React, { useState } from "react";
import {
  User,
  MapPin,
  Heart,
  ShieldCheck,
  AlertTriangle,
  Activity,
  Phone,
  Lock,
  Save,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import AllergySection from "@/components/patient/AllergySection";
import ConditionSection from "@/components/patient/ConditionSection";

interface Patient {
  id: string;
  address: string | null;
  city: string | null;
  region: string | null;
  emergencyName: string | null;
  emergencyPhone: string | null;
  emergencyRelation: string | null;
  insuranceProvider: string | null;
  insurancePolicyNo: string | null;
  insuranceCoverage: string | null;
  insuranceExpiry: string | null;
  allergies: any[];
  medicalConditions: any[];
  user: {
    phone: string | null;
  };
}

interface Props {
  patient: Patient;
  canWrite: boolean; // true for DOCTOR, RECEPTIONIST, ADMIN
  isPatient: boolean;
}

const TABS = [
  { id: "personal", label: "Personal", icon: User },
  { id: "address", label: "Address & Emergency", icon: MapPin },
  { id: "insurance", label: "Insurance", icon: ShieldCheck },
  { id: "allergies", label: "Allergies", icon: AlertTriangle },
  { id: "conditions", label: "Conditions", icon: Activity },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function ProfileTabs({ patient, canWrite, isPatient }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("personal");

  return (
    <div className="space-y-8">
      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-black transition-all duration-200 ${
                isActive
                  ? "bg-[#1E3A5F] text-white shadow-lg shadow-[#1E3A5F]/20"
                  : "bg-white dark:bg-[#1E293B] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-[#1E3A5F] dark:hover:border-blue-500 hover:text-[#1E3A5F] dark:hover:text-blue-400"
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="bg-white dark:bg-[#1E293B] rounded-[2.5rem] border border-[#E2E8F0] dark:border-[#334155] p-8 shadow-sm transition-colors duration-300">
        {activeTab === "personal" && (
          <PersonalTab initialPhone={patient.user.phone || ""} isPatient={isPatient} />
        )}
        {activeTab === "address" && (
          <AddressTab patient={patient} />
        )}
        {activeTab === "insurance" && (
          <InsuranceTab patient={patient} />
        )}
        {activeTab === "allergies" && (
          <AllergySection
            patientId={patient.id}
            initialAllergies={patient.allergies}
            canWrite={canWrite}
          />
        )}
        {activeTab === "conditions" && (
          <ConditionSection
            patientId={patient.id}
            initialConditions={patient.medicalConditions}
            canWrite={canWrite}
          />
        )}
      </div>
    </div>
  );
}

// ─── Personal / Security Tab ───────────────────────────────────────────────────
function PersonalTab({ initialPhone, isPatient }: { initialPhone: string; isPatient: boolean }) {
  const [phone, setPhone] = useState(initialPhone);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password && password !== confirmPassword) {
      return toast.error("Passwords do not match");
    }
    setLoading(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, ...(password ? { password } : {}) }),
      });
      if (res.ok) {
        toast.success("Profile updated successfully!");
        setPassword("");
        setConfirmPassword("");
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to update profile");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleUpdate} className="space-y-8">
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">
          <Phone size={14} className="text-blue-500" /> Contact Phone
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 text-sm font-medium outline-none focus:border-[#1E3A5F] dark:focus:border-blue-500 transition-colors"
          required
        />
      </div>

      {isPatient && (
        <div className="pt-6 border-t border-slate-100 dark:border-slate-700 space-y-6">
          <p className="flex items-center gap-2 text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">
            <Lock size={14} className="text-orange-500" /> Change Password
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">New Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave blank to keep current"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 text-sm font-medium outline-none focus:border-orange-500 transition-colors"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 text-sm font-medium outline-none focus:border-orange-500 transition-colors"
              />
            </div>
          </div>
        </div>
      )}

      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl flex items-start gap-3">
        <AlertCircle className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" size={18} />
        <p className="text-xs text-blue-700 dark:text-blue-300 font-medium leading-relaxed">
          Updating your phone number ensures hospital staff can reach you for urgent changes. Password must be at least 8 characters long.
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex items-center gap-2 px-8 py-3 bg-[#1E3A5F] hover:bg-[#162d4a] text-white rounded-2xl font-black text-sm shadow-lg shadow-[#1E3A5F]/20 transition-all disabled:opacity-50"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        Save Changes
      </button>
    </form>
  );
}

// ─── Address & Emergency Tab ──────────────────────────────────────────────────
function AddressTab({ patient }: { patient: Patient }) {
  const [form, setForm] = useState({
    address: patient.address || "",
    city: patient.city || "",
    region: patient.region || "",
    emergencyName: patient.emergencyName || "",
    emergencyPhone: patient.emergencyPhone || "",
    emergencyRelation: patient.emergencyRelation || "",
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/patients/${patient.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success("Address & emergency contact updated!");
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to update");
      }
    } catch {
      toast.error("Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-8">
      {/* Address */}
      <div className="space-y-4">
        <p className="flex items-center gap-2 text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">
          <MapPin size={14} className="text-[#1E3A5F] dark:text-blue-400" /> Address
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-3 space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Street Address</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              placeholder="e.g. 123 Main Street"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 text-sm font-medium outline-none focus:border-[#1E3A5F] dark:focus:border-blue-500 transition-colors"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">City</label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 text-sm font-medium outline-none focus:border-[#1E3A5F] dark:focus:border-blue-500 transition-colors"
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Region / State</label>
            <input
              type="text"
              value={form.region}
              onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 text-sm font-medium outline-none focus:border-[#1E3A5F] dark:focus:border-blue-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="pt-6 border-t border-slate-100 dark:border-slate-700 space-y-4">
        <p className="flex items-center gap-2 text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">
          <Phone size={14} className="text-red-500" /> Emergency Contact
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Full Name</label>
            <input
              type="text"
              value={form.emergencyName}
              onChange={(e) => setForm((f) => ({ ...f, emergencyName: e.target.value }))}
              placeholder="e.g. Jane Doe"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 text-sm font-medium outline-none focus:border-red-400 transition-colors"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Relation</label>
            <input
              type="text"
              value={form.emergencyRelation}
              onChange={(e) => setForm((f) => ({ ...f, emergencyRelation: e.target.value }))}
              placeholder="e.g. Spouse, Parent"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 text-sm font-medium outline-none focus:border-red-400 transition-colors"
            />
          </div>
          <div className="space-y-1 md:col-span-3">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Phone Number</label>
            <input
              type="tel"
              value={form.emergencyPhone}
              onChange={(e) => setForm((f) => ({ ...f, emergencyPhone: e.target.value }))}
              placeholder="e.g. +251 912 345 678"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 text-sm font-medium outline-none focus:border-red-400 transition-colors"
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex items-center gap-2 px-8 py-3 bg-[#1E3A5F] hover:bg-[#162d4a] text-white rounded-2xl font-black text-sm shadow-lg shadow-[#1E3A5F]/20 transition-all disabled:opacity-50"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        Save Address & Contact
      </button>
    </form>
  );
}

// ─── Insurance Tab ────────────────────────────────────────────────────────────
function InsuranceTab({ patient }: { patient: Patient }) {
  const [form, setForm] = useState({
    insuranceProvider: patient.insuranceProvider || "",
    insurancePolicyNo: patient.insurancePolicyNo || "",
    insuranceCoverage: patient.insuranceCoverage || "",
    insuranceExpiry: patient.insuranceExpiry
      ? new Date(patient.insuranceExpiry).toISOString().split("T")[0]
      : "",
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/patients/${patient.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success("Insurance details updated!");
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to update insurance");
      }
    } catch {
      toast.error("Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-8">
      <div className="space-y-4">
        <p className="flex items-center gap-2 text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">
          <ShieldCheck size={14} className="text-green-500" /> Insurance Information
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Provider Name</label>
            <input
              type="text"
              value={form.insuranceProvider}
              onChange={(e) => setForm((f) => ({ ...f, insuranceProvider: e.target.value }))}
              placeholder="e.g. Ethiopian Health Insurance Agency"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 text-sm font-medium outline-none focus:border-green-500 transition-colors"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Policy Number</label>
            <input
              type="text"
              value={form.insurancePolicyNo}
              onChange={(e) => setForm((f) => ({ ...f, insurancePolicyNo: e.target.value }))}
              placeholder="e.g. EHIA-123456"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 text-sm font-medium outline-none focus:border-green-500 transition-colors"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Coverage Type</label>
            <input
              type="text"
              value={form.insuranceCoverage}
              onChange={(e) => setForm((f) => ({ ...f, insuranceCoverage: e.target.value }))}
              placeholder="e.g. Full, Partial, Emergency Only"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 text-sm font-medium outline-none focus:border-green-500 transition-colors"
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Expiry Date</label>
            <input
              type="date"
              value={form.insuranceExpiry}
              onChange={(e) => setForm((f) => ({ ...f, insuranceExpiry: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 text-sm font-medium outline-none focus:border-green-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Coverage card if data exists */}
      {patient.insuranceProvider && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-5">
          <p className="text-xs font-black text-green-700 dark:text-green-400 uppercase tracking-widest mb-1">
            Current Coverage
          </p>
          <p className="text-sm font-bold text-green-800 dark:text-green-300">{patient.insuranceProvider}</p>
          {patient.insurancePolicyNo && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">Policy: {patient.insurancePolicyNo}</p>
          )}
          {patient.insuranceExpiry && (
            <p className="text-xs text-green-600 dark:text-green-400">
              Expires: {new Date(patient.insuranceExpiry).toLocaleDateString()}
            </p>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="flex items-center gap-2 px-8 py-3 bg-[#1E3A5F] hover:bg-[#162d4a] text-white rounded-2xl font-black text-sm shadow-lg shadow-[#1E3A5F]/20 transition-all disabled:opacity-50"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        Save Insurance Info
      </button>
    </form>
  );
}
