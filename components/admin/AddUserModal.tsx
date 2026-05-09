// components/admin/AddUserModal.tsx
"use client";

import React, { useState } from "react";
import { X, Loader2, UserPlus, Mail, Lock, Phone, Stethoscope, Calendar, Droplets } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Role = "PATIENT" | "DOCTOR" | "RECEPTIONIST";

interface AddUserModalProps {
  role: Role;
  isOpen: boolean;
  onClose: () => void;
}

export default function AddUserModal({ role, isOpen, onClose }: AddUserModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    specialization: "",
    dateOfBirth: "",
    gender: "MALE",
    bloodType: "O_POSITIVE",
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, role }),
      });

      if (res.ok) {
        toast.success(`${role} created successfully!`);
        router.refresh();
        onClose();
        setFormData({
          name: "",
          email: "",
          password: "",
          phone: "",
          specialization: "",
          dateOfBirth: "",
          gender: "MALE",
          bloodType: "O_POSITIVE",
        });
      } else {
        const error = await res.json();
        toast.error(error.message || "Failed to create user");
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#111C3A] w-full max-w-2xl rounded-[3rem] border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-2xl overflow-hidden scale-in duration-300">
        <div className="p-8 border-b border-[#F0F4F8] dark:border-[#0A122A] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#1E4A8A]/10 text-[#1E4A8A] dark:text-[#4A8AC8] rounded-2xl flex items-center justify-center">
              <UserPlus size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#1A2A4A] dark:text-[#E8EEF8]">Register {role}</h2>
              <p className="text-xs font-bold text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-widest">New Administrative Record</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors">
            <X size={24} className="text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
              <div className="relative">
                <UserPlus size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <input
                  required
                  type="text"
                  placeholder="e.g. John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-[#0A122A] border-2 border-transparent rounded-2xl focus:border-[#1E4A8A] outline-none font-bold text-slate-900 dark:text-white transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <input
                  required
                  type="email"
                  placeholder="email@hospital.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-[#0A122A] border-2 border-transparent rounded-2xl focus:border-[#1E4A8A] outline-none font-bold text-slate-900 dark:text-white transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Temporary Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <input
                  required
                  type="password"
                  placeholder="Min. 8 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-[#0A122A] border-2 border-transparent rounded-2xl focus:border-[#1E4A8A] outline-none font-bold text-slate-900 dark:text-white transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
              <div className="relative">
                <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <input
                  required
                  type="tel"
                  placeholder="+254 7XX XXX XXX"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-[#0A122A] border-2 border-transparent rounded-2xl focus:border-[#1E4A8A] outline-none font-bold text-slate-900 dark:text-white transition-all"
                />
              </div>
            </div>
          </div>

          {role === "DOCTOR" && (
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Specialization</label>
              <div className="relative">
                <Stethoscope size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <select
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-[#0A122A] border-2 border-transparent rounded-2xl focus:border-[#1E4A8A] outline-none font-bold text-slate-900 dark:text-white transition-all appearance-none"
                >
                  <option value="">Select Specialization</option>
                  <option value="General Medicine">General Medicine</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="Pediatrics">Pediatrics</option>
                  <option value="Neurology">Neurology</option>
                  <option value="Dermatology">Dermatology</option>
                </select>
              </div>
            </div>
          )}

          {role === "PATIENT" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Date of Birth</label>
                <div className="relative">
                  <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input
                    required
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-[#0A122A] border-2 border-transparent rounded-2xl focus:border-[#1E4A8A] outline-none font-bold text-slate-900 dark:text-white transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Blood Type</label>
                <div className="relative">
                  <Droplets size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                  <select
                    value={formData.bloodType}
                    onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-[#0A122A] border-2 border-transparent rounded-2xl focus:border-[#1E4A8A] outline-none font-bold text-slate-900 dark:text-white transition-all appearance-none"
                  >
                    <option value="O_POSITIVE">O+</option>
                    <option value="O_NEGATIVE">O-</option>
                    <option value="A_POSITIVE">A+</option>
                    <option value="A_NEGATIVE">A-</option>
                    <option value="B_POSITIVE">B+</option>
                    <option value="B_NEGATIVE">B-</option>
                    <option value="AB_POSITIVE">AB+</option>
                    <option value="AB_NEGATIVE">AB-</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="pt-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-[#1E4A8A] hover:bg-[#0F3A6A] text-white rounded-[1.5rem] font-black text-lg shadow-xl shadow-[#1E4A8A]/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" /> : <UserPlus size={20} />}
              Confirm & Create {role}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
