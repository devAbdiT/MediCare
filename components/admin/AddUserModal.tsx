// components/admin/AddUserModal.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Loader2,
  UserPlus,
  Mail,
  Lock,
  Phone,
  Stethoscope,
  Calendar,
  Droplets,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  patientSchema,
  doctorSchema,
  receptionistSchema,
} from "@/lib/validations";
import { formatPhoneNumber } from "@/lib/phone-format";

type Role = "PATIENT" | "DOCTOR" | "RECEPTIONIST" | "PHARMACIST" | "LABTECH";

interface AddUserModalProps {
  role: Role;
  isOpen: boolean;
  onClose: () => void;
}

export default function AddUserModal({ role, isOpen, onClose }: AddUserModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Determine the correct schema based on the role
  const currentSchema =
    role === "DOCTOR"
      ? doctorSchema
      : (role === "RECEPTIONIST" || role === "PHARMACIST" || role === "LABTECH")
      ? receptionistSchema
      : patientSchema;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(currentSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      phone: "",
      specialization: "",
      dateOfBirth: "",
      gender: "Male",
      bloodType: "O_POSITIVE",
    },
  });

  // Reset form when modal opens or closes
  useEffect(() => {
    if (isOpen) reset();
  }, [isOpen, reset]);

  if (!isOpen) return null;

  const onSubmit = async (data: any) => {
    setLoading(true);

    try {
      const formattedPhone = formatPhoneNumber(data.phone);

      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, phone: formattedPhone, role }),
      });

      if (res.ok) {
        toast.success(`${role} created successfully!`);
        router.refresh();
        onClose();
        reset();
      } else {
        const error = await res.json();
        toast.error(error.message || "Failed to create user");
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred");
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
              <h2 className="text-2xl font-black text-[#1A2A4A] dark:text-[#E8EEF8]">
                Register {role}
              </h2>
              <p className="text-xs font-bold text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-widest">
                New Administrative Record
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X size={24} className="text-slate-400" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="p-10 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                Full Name
              </label>
              <div className="relative">
                <UserPlus
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
                />
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  {...register("name")}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-[#0A122A] border-2 border-transparent rounded-2xl focus:border-[#1E4A8A] outline-none font-bold text-slate-900 dark:text-white transition-all"
                />
              </div>
              {errors.name && (
                <p className="text-xs text-red-500 font-bold ml-2 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.name.message as string}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                Email Address
              </label>
              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
                />
                <input
                  type="email"
                  placeholder="email@hospital.com"
                  {...register("email")}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-[#0A122A] border-2 border-transparent rounded-2xl focus:border-[#1E4A8A] outline-none font-bold text-slate-900 dark:text-white transition-all"
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-500 font-bold ml-2 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.email.message as string}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                Temporary Password
              </label>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
                />
                <input
                  type="password"
                  placeholder="Min. 8 characters"
                  {...register("password")}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-[#0A122A] border-2 border-transparent rounded-2xl focus:border-[#1E4A8A] outline-none font-bold text-slate-900 dark:text-white transition-all"
                />
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 font-bold ml-2 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.password.message as string}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
                />
                <input
                  type="tel"
                  placeholder="+254 7XX XXX XXX"
                  {...register("phone")}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-[#0A122A] border-2 border-transparent rounded-2xl focus:border-[#1E4A8A] outline-none font-bold text-slate-900 dark:text-white transition-all"
                />
              </div>
              {errors.phone && (
                <p className="text-xs text-red-500 font-bold ml-2 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.phone.message as string}
                </p>
              )}
            </div>
          </div>

          {role === "DOCTOR" && (
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                Specialization
              </label>
              <div className="relative">
                <Stethoscope
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
                />
                <select
                  {...register("specialization")}
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
              {errors.specialization && (
                <p className="text-xs text-red-500 font-bold ml-2 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.specialization.message as string}
                </p>
              )}
            </div>
          )}

          {role === "PATIENT" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                  Date of Birth
                </label>
                <div className="relative">
                  <Calendar
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
                  />
                  <input
                    type="date"
                    {...register("dateOfBirth")}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-[#0A122A] border-2 border-transparent rounded-2xl focus:border-[#1E4A8A] outline-none font-bold text-slate-900 dark:text-white transition-all"
                  />
                </div>
                {errors.dateOfBirth && (
                  <p className="text-xs text-red-500 font-bold ml-2 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.dateOfBirth.message as string}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                  Gender
                </label>
                <div className="relative">
                  <UserPlus
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
                  />
                  <select
                    {...register("gender")}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-[#0A122A] border-2 border-transparent rounded-2xl focus:border-[#1E4A8A] outline-none font-bold text-slate-900 dark:text-white transition-all appearance-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                {errors.gender && (
                  <p className="text-xs text-red-500 font-bold ml-2 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.gender.message as string}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                  Blood Type
                </label>
                <div className="relative">
                  <Droplets
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
                  />
                  <select
                    {...register("bloodType")}
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
                {errors.bloodType && (
                  <p className="text-xs text-red-500 font-bold ml-2 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.bloodType.message as string}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="pt-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-[#1E4A8A] hover:bg-[#0F3A6A] text-white rounded-[1.5rem] font-black text-lg shadow-xl shadow-[#1E4A8A]/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <UserPlus size={20} />
              )}
              Confirm & Create {role}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
