// app/register/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  UserPlus, 
  Mail, 
  Lock, 
  Phone, 
  Calendar, 
  Droplets,
  Loader2,
  ArrowLeft,
  User,
  Users,
  Stethoscope,
  Hash,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { differenceInYears } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerPatientSchema } from "@/lib/validations";
import { formatPhoneNumber } from "@/lib/phone-format";
import * as z from "zod";

type RegisterFormValues = z.input<typeof registerPatientSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerPatientSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      dateOfBirth: "",
      age: undefined,
      bloodType: "",
      gender: "MALE"
    }
  });

  const dobValue = watch("dateOfBirth");
  const ageValue = watch("age");

  // Handle auto-calculation of age from DOB and clearing DOB if age is typed
  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setValue("dateOfBirth", value, { shouldValidate: true });
    if (value) {
      const calculated = differenceInYears(new Date(), new Date(value));
      setValue("age", calculated, { shouldValidate: true });
    }
  };

  const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setValue("age", value ? Number(value) : undefined, { shouldValidate: true });
    if (value) {
      setValue("dateOfBirth", "", { shouldValidate: true });
    }
  };

  const onSubmit = async (data: RegisterFormValues) => {
    if (!data.dateOfBirth && data.age === undefined) {
      toast.error("Please provide either a Date of Birth or an Age");
      return;
    }

    setLoading(true);

    try {
      const formattedPhone = formatPhoneNumber(data.phone);

      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          phone: formattedPhone,
          password: data.password,
          dateOfBirth: data.dateOfBirth || undefined,
          age: data.age,
          bloodType: data.bloodType || undefined,
          gender: data.gender
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Registration failed");
      }

      toast.success("Registration successful! Please login.");
      router.push("/login");
    } catch (error: any) {
      toast.error(error.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full pl-12 pr-4 py-4 bg-[#F0F4F8] dark:bg-[#0A122A] border-2 border-transparent rounded-2xl focus:border-[#1E4A8A] dark:focus:border-[#4A8AC8] outline-none font-bold text-[#1A2A4A] dark:text-[#E8EEF8] transition-all";
  const labelClass = "text-xs font-black text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-widest ml-2";

  return (
    <div className="min-h-screen bg-[#F0F4F8] dark:bg-[#0A122A] flex items-center justify-center p-4 transition-colors duration-700">
      {/* Theme Toggle */}
      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="fixed top-8 right-8 w-12 h-12 rounded-2xl bg-white dark:bg-[#111C3A] border border-[#D0DCE8] dark:border-[#1A2A4A] flex items-center justify-center text-[#5A6E8A] dark:text-[#8A9CBA] hover:text-[#1E4A8A] dark:hover:text-[#4A8AC8] transition-all shadow-sm z-50"
      >
        {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <div className="w-full max-w-2xl">
        {/* Back to Home */}
        <Link 
          href="/"
          className="inline-flex items-center gap-2 mb-8 text-[#5A6E8A] dark:text-[#8A9CBA] hover:text-[#1E4A8A] dark:hover:text-[#4A8AC8] transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="font-bold text-sm uppercase tracking-widest">Back to Home</span>
        </Link>

        {/* Registration Card */}
        <div className="bg-white dark:bg-[#111C3A] rounded-[3rem] border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-2xl overflow-hidden transition-colors duration-500">
          {/* Header */}
          <div className="p-10 border-b border-[#F0F4F8] dark:border-[#0A122A] bg-[#F0F4F8] dark:bg-[#0A122A] transition-colors duration-500">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-[#1E4A8A] dark:bg-[#4A8AC8] rounded-3xl flex items-center justify-center text-white shadow-xl">
                <Stethoscope size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-black text-[#1A2A4A] dark:text-[#E8EEF8] tracking-tighter">Patient Registration</h1>
                <p className="text-[#5A6E8A] dark:text-[#8A9CBA] font-medium mt-1">Create your MediCare account</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-10 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Full Name */}
              <div className="space-y-2">
                <label className={labelClass}>Full Name</label>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5A6E8A] dark:text-[#8A9CBA]" />
                  <input type="text" {...register("name")} placeholder="John Doe" className={inputClass} />
                </div>
                {errors.name && (
                  <p className="text-xs text-red-500 font-bold ml-2 flex items-center gap-1"><AlertCircle size={12}/> {errors.name.message}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className={labelClass}>Email Address</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5A6E8A] dark:text-[#8A9CBA]" />
                  <input type="email" {...register("email")} placeholder="john@example.com" className={inputClass} />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-500 font-bold ml-2 flex items-center gap-1"><AlertCircle size={12}/> {errors.email.message}</p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <label className={labelClass}>Phone Number</label>
                <div className="relative">
                  <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5A6E8A] dark:text-[#8A9CBA]" />
                  <input type="tel" {...register("phone")} placeholder="+251911223344" className={inputClass} />
                </div>
                {errors.phone && (
                  <p className="text-xs text-red-500 font-bold ml-2 flex items-center gap-1"><AlertCircle size={12}/> {errors.phone.message}</p>
                )}
              </div>

              {/* Gender */}
              <div className="space-y-2">
                <label className={labelClass}>Gender</label>
                <div className="relative">
                  <Users size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5A6E8A] dark:text-[#8A9CBA]" />
                  <select {...register("gender")} className={`${inputClass} appearance-none`}>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                {errors.gender && (
                  <p className="text-xs text-red-500 font-bold ml-2 flex items-center gap-1"><AlertCircle size={12}/> {errors.gender.message}</p>
                )}
              </div>

              {/* Date of Birth — auto-fills Age */}
              <div className="space-y-2">
                <label className={labelClass}>
                  Date of Birth
                  <span className="ml-2 font-medium normal-case tracking-normal text-[#5A6E8A]/60 dark:text-[#8A9CBA]/60 lowercase">(auto-fills age)</span>
                </label>
                <div className="relative">
                  <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5A6E8A] dark:text-[#8A9CBA]" />
                  <input
                    type="date"
                    {...register("dateOfBirth")}
                    onChange={handleDobChange}
                    max={new Date().toISOString().split("T")[0]}
                    className={inputClass}
                  />
                </div>
                {errors.dateOfBirth && (
                  <p className="text-xs text-red-500 font-bold ml-2 flex items-center gap-1"><AlertCircle size={12}/> {errors.dateOfBirth.message}</p>
                )}
              </div>

              {/* Age — can be entered manually */}
              <div className="space-y-2">
                <label className={labelClass}>
                  Age (years)
                  <span className="ml-2 font-medium normal-case tracking-normal text-[#5A6E8A]/60 dark:text-[#8A9CBA]/60 lowercase">(or enter manually)</span>
                </label>
                <div className="relative">
                  <Hash size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5A6E8A] dark:text-[#8A9CBA]" />
                  <input
                    type="number"
                    {...register("age")}
                    onChange={handleAgeChange}
                    placeholder="e.g. 34"
                    min={0}
                    max={120}
                    className={inputClass}
                  />
                </div>
                {errors.age && (
                  <p className="text-xs text-red-500 font-bold ml-2 flex items-center gap-1"><AlertCircle size={12}/> {errors.age.message}</p>
                )}
              </div>

              {/* Blood Type — OPTIONAL */}
              <div className="space-y-2">
                <label className={labelClass}>
                  Blood Type
                  <span className="ml-2 font-medium normal-case tracking-normal text-[#5A6E8A]/60 dark:text-[#8A9CBA]/60 lowercase">(optional)</span>
                </label>
                <div className="relative">
                  <Droplets size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5A6E8A] dark:text-[#8A9CBA]" />
                  <select {...register("bloodType")} className={`${inputClass} appearance-none`}>
                    <option value="">— Unknown / Skip —</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
                {errors.bloodType && (
                  <p className="text-xs text-red-500 font-bold ml-2 flex items-center gap-1"><AlertCircle size={12}/> {errors.bloodType.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className={labelClass}>Password</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5A6E8A] dark:text-[#8A9CBA]" />
                  <input type="password" {...register("password")} placeholder="Min. 8 chars, letters, numbers, symbols" className={inputClass} />
                </div>
                {errors.password && (
                  <p className="text-xs text-red-500 font-bold ml-2 flex items-center gap-1"><AlertCircle size={12}/> {errors.password.message}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2 md:col-span-2">
                <label className={labelClass}>Confirm Password</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5A6E8A] dark:text-[#8A9CBA]" />
                  <input type="password" {...register("confirmPassword")} placeholder="Re-enter password" className={inputClass} />
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-red-500 font-bold ml-2 flex items-center gap-1"><AlertCircle size={12}/> {errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            {/* Helper note */}
            <p className="text-xs text-[#5A6E8A] dark:text-[#8A9CBA] bg-[#F0F4F8] dark:bg-[#0A122A] rounded-2xl px-6 py-4 font-medium">
              ℹ️ At least one of <strong>Date of Birth</strong> or <strong>Age</strong> is required. If you enter a Date of Birth, the Age will be calculated automatically.
            </p>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-[#1E4A8A] hover:bg-[#0F3A6A] dark:bg-[#4A8AC8] dark:hover:bg-[#1E4A8A] text-white rounded-[1.5rem] font-black text-lg shadow-xl shadow-[#1E4A8A]/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50 uppercase tracking-widest"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={24} />
                ) : (
                  <>
                    <UserPlus size={24} />
                    Create Account
                  </>
                )}
              </button>
            </div>

            {/* Login Link */}
            <div className="text-center pt-2">
              <p className="text-[#5A6E8A] dark:text-[#8A9CBA] font-medium">
                Already have an account?{" "}
                <Link href="/login" className="text-[#1E4A8A] dark:text-[#4A8AC8] font-black hover:underline">
                  Login here
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
