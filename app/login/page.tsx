// app/login/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import {
  Stethoscope,
  ShieldCheck,
  User,
  Lock,
  Loader2,
  ArrowRight,
  Zap,
  Activity,
  HeartPulse,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
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
        callbackURL: "/dashboard",
      });

      if (error) {
        toast.error(error.message || "Invalid credentials");
      } else {
        toast.success("Welcome back!");
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
    <div className="min-h-screen bg-[#F0F4F8] dark:bg-[#0A122A] flex p-4 lg:p-8 gap-8 font-sans selection:bg-[#1E4A8A]/10 dark:selection:bg-[#4A8AC8]/20 selection:text-[#1E4A8A] transition-colors duration-700 overflow-hidden relative">
      {/* Theme Toggle */}
      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="fixed top-8 right-8 w-12 h-12 rounded-2xl bg-white dark:bg-[#111C3A] border border-[#D0DCE8] dark:border-[#1A2A4A] flex items-center justify-center text-[#5A6E8A] dark:text-[#8A9CBA] hover:text-[#1E4A8A] dark:hover:text-[#4A8AC8] transition-all shadow-sm z-50"
      >
        {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
      </button>
      {/* Left Side - Hero Visual Overlay */}
      <div className="hidden lg:flex lg:w-[45%] bg-[#1E4A8A] dark:bg-[#111C3A] relative overflow-hidden flex-col justify-between p-16 rounded-[3.5rem] shadow-2xl transition-all duration-700">
        {/* Animated Background Orbs */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#4A8AC8] rounded-full -mr-64 -mt-64 opacity-10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#2D8A6E] rounded-full -ml-32 -mb-32 opacity-10 blur-[100px]" />

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-16">
            <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-[#1E4A8A] shadow-2xl group hover:rotate-12 transition-transform duration-500">
              <Stethoscope size={32} />
            </div>
            <div>
              <span className="text-3xl font-black tracking-tighter text-white block leading-none">
                MediCare
              </span>
              <span className="text-xs font-black text-[#4A8AC8] uppercase tracking-[0.4em] mt-2 block">
                Enterprise OS
              </span>
            </div>
          </div>

          <h1 className="text-6xl font-black text-white mb-10 leading-[1.1] tracking-tighter">
            Seamless <br />
            <span className="text-[#8A9CBA]">Connectivity.</span>
          </h1>

          <div className="space-y-8 max-w-sm">
            <div className="bg-white/10 backdrop-blur-xl border border-white/10 p-6 rounded-[2rem] flex items-center gap-4 hover:bg-white/20 transition-all">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white">
                <ShieldCheck size={24} />
              </div>
              <p className="text-sm font-bold text-white leading-tight">
                Quantum-grade data encryption active.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-xl border border-white/10 p-6 rounded-[2rem] flex items-center gap-4 hover:bg-white/20 transition-all">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white">
                <Activity size={24} />
              </div>
              <p className="text-sm font-bold text-white leading-tight">
                Real-time clinical synchronization.
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-6 pt-12 border-t border-white/10">
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-[#8A9CBA]" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest">
              SLA 100%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Lock size={14} className="text-[#8A9CBA]" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest">
              AES-256
            </span>
          </div>
        </div>
      </div>

      {/* Right Side - Floating Form Area */}
      <div className="flex-1 flex items-center justify-center relative overflow-y-auto custom-scrollbar">
        <div className="w-full max-w-lg space-y-10 p-8 lg:p-0">
          <div className="text-center lg:text-left space-y-4">
            <h2 className="text-5xl font-black text-[#1A2A4A] dark:text-[#E8EEF8] tracking-tighter">
              Authorization
            </h2>
            <p className="text-[#5A6E8A] dark:text-[#8A9CBA] text-lg font-medium">
              Identify yourself to enter the Command Center.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-[0.3em] ml-2">
                Clinical Identifier (Email)
              </label>
              <div className="relative group">
                <User
                  className="absolute left-6 top-1/2 -translate-y-1/2 text-[#5A6E8A] group-focus-within:text-[#1E4A8A] transition-colors"
                  size={20}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-16 pr-8 py-6 bg-white dark:bg-[#111C3A] border-2 border-[#D0DCE8] dark:border-[#1A2A4A] rounded-[2rem] focus:border-[#1E4A8A] dark:focus:border-[#4A8AC8] outline-none transition-all font-bold text-[#1A2A4A] dark:text-[#E8EEF8] text-lg shadow-sm"
                  placeholder="name@hospital.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-[0.3em] ml-2">
                Secure Passkey
              </label>
              <div className="relative group">
                <Lock
                  className="absolute left-6 top-1/2 -translate-y-1/2 text-[#5A6E8A] group-focus-within:text-[#1E4A8A] transition-colors"
                  size={20}
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-16 pr-8 py-6 bg-white dark:bg-[#111C3A] border-2 border-[#D0DCE8] dark:border-[#1A2A4A] rounded-[2rem] focus:border-[#1E4A8A] dark:focus:border-[#4A8AC8] outline-none transition-all font-bold text-[#1A2A4A] dark:text-[#E8EEF8] text-lg shadow-sm"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between px-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    className="peer w-6 h-6 opacity-0 absolute cursor-pointer"
                  />
                  <div className="w-6 h-6 border-2 border-[#D0DCE8] dark:border-[#1A2A4A] rounded-lg peer-checked:bg-[#1E4A8A] peer-checked:border-[#1E4A8A] transition-all flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full opacity-0 peer-checked:opacity-100 transition-opacity" />
                  </div>
                  <span className="ml-3 text-sm font-black text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-widest">
                    Keep Sync Active
                  </span>
                </div>
              </label>
              <a
                href="#"
                className="text-xs font-black text-[#1E4A8A] dark:text-[#4A8AC8] uppercase tracking-widest hover:underline underline-offset-4"
              >
                Reset Credentials
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1E4A8A] dark:bg-[#4A8AC8] text-white py-6 rounded-[2rem] font-black text-xl shadow-2xl shadow-[#1E4A8A]/30 hover:bg-[#0F3A6A] hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-70 disabled:cursor-not-allowed group uppercase tracking-[0.2em]"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={28} />
              ) : (
                <>
                  Establish Connection
                  <ArrowRight
                    size={24}
                    className="group-hover:translate-x-2 transition-transform"
                  />
                </>
              )}
            </button>
          </form>

          {/* Demo Manifest - Floating Glass Box */}
          <div className="p-8 bg-blue-50/50 dark:bg-blue-900/10 rounded-[2.5rem] border border-[#D0DCE8] dark:border-[#1A2A4A]">
            <h4 className="text-[10px] font-black text-[#1E4A8A] dark:text-[#4A8AC8] uppercase tracking-[0.5em] mb-6 text-center">
              Node Access Manifest
            </h4>
            <div className="grid grid-cols-2 gap-6 text-[10px] font-black text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-widest">
              <DemoItem role="Admin" email="admin@hospital.com" />
              <DemoItem role="Doctor" email="doctor1@hospital.com" />
              <DemoItem role="Staff" email="receptionist1@hospital.com" />
              <DemoItem role="Patient" email="patient1@example.com" />
            </div>
            <p className="text-[9px] text-[#1E4A8A]/50 dark:text-[#4A8AC8]/30 mt-6 text-center font-black uppercase tracking-[0.3em]">
              Access Key for All Nodes: password123
            </p>
          </div>
        </div>

        {/* Cinematic Watermark */}
        <div className="absolute bottom-12 right-12 flex items-center gap-3 opacity-20">
          <HeartPulse size={24} className="text-[#1E4A8A] animate-pulse" />
          <span className="text-[10px] font-black text-[#1A2A4A] dark:text-[#E8EEF8] uppercase tracking-[0.5em]">
            Global Clinical OS v2.4.1
          </span>
        </div>
      </div>
    </div>
  );
}

function DemoItem({ role, email }: { role: string; email: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[#1A2A4A] dark:text-[#E8EEF8]">{role}</span>
      <span className="opacity-60 lowercase font-medium tracking-tight text-[11px]">
        {email}
      </span>
    </div>
  );
}
