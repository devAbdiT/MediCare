// app/login/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Stethoscope, ShieldCheck, User, Lock, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await authClient.signIn.email({
        email,
        password,
        callbackURL: "/dashboard", // Middleware will redirect to correct sub-dashboard
      });

      if (error) {
        toast.error(error.message || "Invalid credentials");
      } else {
        toast.success("Welcome back!");
        // Small delay to allow session to sync
        setTimeout(() => {
          router.push("/dashboard"); 
        }, 100);
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row font-sans">
      {/* Left Side - Visual & Branding */}
      <div className="lg:w-1/2 bg-blue-600 relative overflow-hidden flex flex-col justify-center p-12 text-white">
        {/* Abstract background elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full -mr-48 -mt-48 opacity-20 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-400 rounded-full -ml-48 -mb-48 opacity-20 blur-3xl" />
        
        <div className="relative z-10 max-w-md">
          <div className="flex items-center gap-3 mb-8 bg-white/10 w-fit px-4 py-2 rounded-2xl backdrop-blur-md">
            <Stethoscope size={32} />
            <span className="text-2xl font-black tracking-tight">MediCare</span>
          </div>
          
          <h1 className="text-5xl font-black mb-6 leading-tight">
            Managing health <br />
            <span className="text-blue-200">Simplified.</span>
          </h1>
          
          <p className="text-blue-100 text-lg mb-12 font-medium opacity-90">
            A comprehensive management platform for patients, doctors, and hospital administration.
          </p>

          <div className="space-y-6">
            <Feature icon={<ShieldCheck className="text-blue-300" />} title="Secure & Encrypted" desc="Your medical data is protected by industry-standard encryption." />
            <Feature icon={<User className="text-blue-300" />} title="Role-Based Access" desc="Tailored interfaces for Patients, Doctors, and Staff." />
          </div>
        </div>

        <div className="absolute bottom-8 left-12 text-blue-300 text-sm font-bold tracking-widest uppercase">
          © 2026 MediCare Health Systems
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="lg:w-1/2 flex items-center justify-center p-8 bg-slate-50 lg:bg-white">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-black text-slate-900 mb-2">Welcome Back</h2>
            <p className="text-slate-500 font-medium italic">Please enter your credentials to access your dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-600 outline-none transition-all font-medium text-slate-900"
                  placeholder="admin@hospital.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-600 outline-none transition-all font-medium text-slate-900"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600" />
                <span className="text-slate-600 font-bold group-hover:text-slate-900 transition-colors">Remember me</span>
              </label>
              <a href="#" className="text-blue-600 font-bold hover:underline underline-offset-4">Forgot password?</a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-slate-200 hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={24} />
              ) : (
                <>
                  Sign In to Dashboard
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 mt-12">
            <h4 className="text-blue-800 font-black text-xs uppercase tracking-widest mb-2">Demo Access</h4>
            <div className="grid grid-cols-2 gap-4 text-xs font-bold text-blue-700">
              <div className="flex flex-col">
                <span>Admin</span>
                <span className="opacity-60">admin@hospital.com</span>
              </div>
              <div className="flex flex-col">
                <span>Doctor</span>
                <span className="opacity-60">dr.alex@hospital.com</span>
              </div>
              <div className="flex flex-col mt-2">
                <span>Reception</span>
                <span className="opacity-60">reception@hospital.com</span>
              </div>
              <div className="flex flex-col mt-2">
                <span>Patient</span>
                <span className="opacity-60">patient@hospital.com</span>
              </div>
            </div>
            <p className="text-[10px] text-blue-400 mt-4 font-bold text-center">Password for all: password123</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex gap-4">
      <div className="w-12 h-12 rounded-2xl bg-white/10 flex-shrink-0 flex items-center justify-center backdrop-blur-sm">
        {icon}
      </div>
      <div>
        <h4 className="font-bold text-lg">{title}</h4>
        <p className="text-blue-200 text-sm font-medium">{desc}</p>
      </div>
    </div>
  );
}
