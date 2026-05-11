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
  Stethoscope
} from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    dateOfBirth: "",
    bloodType: "O+"
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          dateOfBirth: formData.dateOfBirth,
          bloodType: formData.bloodType
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
          <form onSubmit={handleSubmit} className="p-10 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div className="space-y-2">
                <label className="text-xs font-black text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-widest ml-2">
                  Full Name
                </label>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5A6E8A] dark:text-[#8A9CBA]" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    required
                    className="w-full pl-12 pr-4 py-4 bg-[#F0F4F8] dark:bg-[#0A122A] border-2 border-transparent rounded-2xl focus:border-[#1E4A8A] dark:focus:border-[#4A8AC8] outline-none font-bold text-[#1A2A4A] dark:text-[#E8EEF8] transition-all"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-xs font-black text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-widest ml-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5A6E8A] dark:text-[#8A9CBA]" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john@example.com"
                    required
                    className="w-full pl-12 pr-4 py-4 bg-[#F0F4F8] dark:bg-[#0A122A] border-2 border-transparent rounded-2xl focus:border-[#1E4A8A] dark:focus:border-[#4A8AC8] outline-none font-bold text-[#1A2A4A] dark:text-[#E8EEF8] transition-all"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <label className="text-xs font-black text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-widest ml-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5A6E8A] dark:text-[#8A9CBA]" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+251911223344"
                    required
                    className="w-full pl-12 pr-4 py-4 bg-[#F0F4F8] dark:bg-[#0A122A] border-2 border-transparent rounded-2xl focus:border-[#1E4A8A] dark:focus:border-[#4A8AC8] outline-none font-bold text-[#1A2A4A] dark:text-[#E8EEF8] transition-all"
                  />
                </div>
              </div>

              {/* Date of Birth */}
              <div className="space-y-2">
                <label className="text-xs font-black text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-widest ml-2">
                  Date of Birth
                </label>
                <div className="relative">
                  <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5A6E8A] dark:text-[#8A9CBA]" />
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    required
                    className="w-full pl-12 pr-4 py-4 bg-[#F0F4F8] dark:bg-[#0A122A] border-2 border-transparent rounded-2xl focus:border-[#1E4A8A] dark:focus:border-[#4A8AC8] outline-none font-bold text-[#1A2A4A] dark:text-[#E8EEF8] transition-all"
                  />
                </div>
              </div>

              {/* Blood Type */}
              <div className="space-y-2">
                <label className="text-xs font-black text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-widest ml-2">
                  Blood Type
                </label>
                <div className="relative">
                  <Droplets size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5A6E8A] dark:text-[#8A9CBA]" />
                  <select
                    name="bloodType"
                    value={formData.bloodType}
                    onChange={handleChange}
                    required
                    className="w-full pl-12 pr-4 py-4 bg-[#F0F4F8] dark:bg-[#0A122A] border-2 border-transparent rounded-2xl focus:border-[#1E4A8A] dark:focus:border-[#4A8AC8] outline-none font-bold text-[#1A2A4A] dark:text-[#E8EEF8] transition-all appearance-none"
                  >
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
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-xs font-black text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-widest ml-2">
                  Password
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5A6E8A] dark:text-[#8A9CBA]" />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min. 8 characters"
                    required
                    minLength={8}
                    className="w-full pl-12 pr-4 py-4 bg-[#F0F4F8] dark:bg-[#0A122A] border-2 border-transparent rounded-2xl focus:border-[#1E4A8A] dark:focus:border-[#4A8AC8] outline-none font-bold text-[#1A2A4A] dark:text-[#E8EEF8] transition-all"
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label className="text-xs font-black text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-widest ml-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5A6E8A] dark:text-[#8A9CBA]" />
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter password"
                    required
                    className="w-full pl-12 pr-4 py-4 bg-[#F0F4F8] dark:bg-[#0A122A] border-2 border-transparent rounded-2xl focus:border-[#1E4A8A] dark:focus:border-[#4A8AC8] outline-none font-bold text-[#1A2A4A] dark:text-[#E8EEF8] transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6">
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
            <div className="text-center pt-4">
              <p className="text-[#5A6E8A] dark:text-[#8A9CBA] font-medium">
                Already have an account?{" "}
                <Link 
                  href="/login" 
                  className="text-[#1E4A8A] dark:text-[#4A8AC8] font-black hover:underline"
                >
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
