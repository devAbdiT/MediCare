// app/page.tsx
"use client";

import React from "react";
import Link from "next/link";
import { 
  Stethoscope, 
  ArrowRight, 
  ShieldCheck, 
  HeartPulse,
  Activity,
  Sun,
  Moon,
  UserPlus
} from "lucide-react";
import { useTheme } from "next-themes";

export default function Home() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-[#F0F4F8] dark:bg-[#0A122A] overflow-hidden relative selection:bg-[#1E4A8A]/10 dark:selection:bg-[#4A8AC8]/20 selection:text-[#1E4A8A] transition-colors duration-700">
      {/* Cinematic Background */}
      <div className="absolute top-0 right-0 w-[1200px] h-[1200px] bg-gradient-to-br from-[#1E4A8A]/20 to-[#2D8A6E]/10 dark:from-[#4A8AC8]/10 dark:to-[#4AA88A]/5 rounded-full blur-[160px] -mr-[400px] -mt-[400px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[1000px] h-[1000px] bg-gradient-to-tr from-[#3A7BC8]/20 to-[#1E4A8A]/10 dark:from-[#2A6ABA]/10 dark:to-[#4A8AC8]/5 rounded-full blur-[140px] -ml-[300px] -mb-[300px] pointer-events-none" />

      {/* Modern Floating Navigation */}
      <nav className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-4rem)] max-w-7xl">
        <div className="bg-white/70 dark:bg-[#111C3A]/70 backdrop-blur-2xl border border-white/20 dark:border-white/5 px-8 py-5 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] flex items-center justify-between transition-all duration-500">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#1E4A8A] rounded-2xl flex items-center justify-center text-white shadow-xl shadow-[#1E4A8A]/20 group hover:rotate-12 transition-transform duration-500">
              <Stethoscope size={26} />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tighter text-[#1A2A4A] dark:text-[#E8EEF8] leading-none">MediCare</span>
              <span className="text-[9px] font-black text-[#1E4A8A] uppercase tracking-[0.1em] mt-1">Appointment Scheduling System</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="w-12 h-12 rounded-2xl bg-white/50 dark:bg-[#0A122A]/50 border border-white/20 dark:border-white/5 flex items-center justify-center text-[#1A2A4A] dark:text-[#E8EEF8] hover:bg-white dark:hover:bg-[#0A122A] transition-all shadow-lg"
            >
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            
            {/* Register Button */}
            <Link href="/register" className="px-8 py-4 bg-white dark:bg-[#1A2A4A] text-[#1E4A8A] dark:text-white border-2 border-[#1E4A8A] dark:border-[#4A8AC8] rounded-2xl font-black shadow-xl hover:bg-[#1E4A8A] hover:text-white dark:hover:bg-[#4A8AC8] hover:scale-105 active:scale-95 transition-all text-[11px] uppercase tracking-widest flex items-center gap-2">
              <UserPlus size={16} />
              Register as Patient
            </Link>
            
            {/* Login Button */}
            <Link href="/login" className="px-10 py-4 bg-[#1A2A4A] dark:bg-[#0A122A] text-white rounded-2xl font-black shadow-2xl hover:bg-[#1E4A8A] dark:hover:bg-[#4A8AC8] hover:scale-105 active:scale-95 transition-all text-[11px] uppercase tracking-widest">
              Access Portal
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Workspace */}
      <main className="max-w-7xl mx-auto px-8 pt-64 pb-32 relative z-10 flex flex-col items-center justify-center min-h-[90vh]">
        <div className="flex flex-col lg:flex-row items-center gap-24">
          {/* Left: Narrative Content */}
          <div className="flex-1 space-y-12 text-center lg:text-left">
            <div className="inline-flex items-center gap-3 px-6 py-2.5 bg-[#F0F4F8] dark:bg-[#1A2A4A]/40 rounded-full border border-[#D0DCE8] dark:border-[#1A2A4A] mx-auto lg:mx-0 w-fit">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1E4A8A] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#1E4A8A]"></span>
              </span>
              <span className="text-[10px] font-black text-[#1E4A8A] dark:text-[#4A8AC8] uppercase tracking-[0.3em]">System v2.4.1 Active</span>
            </div>
            
            <h1 className="text-[5rem] lg:text-[10rem] font-black text-[#1A2A4A] dark:text-[#E8EEF8] leading-[0.8] tracking-tighter transition-colors">
              Medical <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1E4A8A] via-[#3A7BC8] to-[#2D8A6E] dark:from-[#4A8AC8] dark:to-[#4AA88A] animate-gradient-x">Intelligence.</span>
            </h1>
            
            <p className="max-w-xl text-[#5A6E8A] dark:text-[#8A9CBA] text-xl font-medium leading-relaxed mx-auto lg:mx-0">
              Web-Based Patient Appointment Scheduling and Basic Medical Record Management System for Jimma Medical Center.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start pt-4">
              <Link href="/login" className="px-12 py-8 bg-[#1E4A8A] dark:bg-[#1E4A8A] text-white rounded-[2.5rem] font-black text-xl flex items-center justify-center gap-4 shadow-[0_25px_50px_-12px_rgba(30,74,138,0.5)] hover:bg-[#0F3A6A] hover:-translate-y-1 transition-all group">
                Enter Command Center
                <ArrowRight size={32} className="group-hover:translate-x-2 transition-transform" />
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-12 pt-12 border-t border-[#D0DCE8] dark:border-[#1A2A4A]">
              <StatItem value="100%" label="Uptime SLA" />
              <StatItem value="256-bit" label="Encryption" />
              <StatItem value="Multi-Node" label="Architecture" />
            </div>
          </div>

          {/* Right: Architectural Visual */}
          <div className="flex-1 relative group w-full max-w-lg lg:max-w-none">
            <div className="relative z-10 transition-transform duration-1000 group-hover:scale-[1.05] animate-float">
              <div className="absolute inset-0 bg-gradient-to-br from-[#1E4A8A]/30 to-[#2D8A6E]/30 blur-[100px] opacity-0 group-hover:opacity-50 transition-opacity" />
              <img 
                src="/char.png" 
                alt="MediCare AI Specialist"
                className="w-full h-auto drop-shadow-[0_80px_80px_rgba(0,0,0,0.15)] rounded-[5rem] relative z-20"
              />
            </div>

            {/* Float Cards */}
            <div className="absolute -right-8 top-1/4 z-30 bg-white/90 dark:bg-[#111C3A]/90 backdrop-blur-2xl p-8 rounded-[3rem] border border-white dark:border-white/5 shadow-2xl animate-bounce hidden xl:block">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-[#2D8A6E]/10 text-[#2D8A6E] rounded-3xl flex items-center justify-center shadow-inner">
                  <HeartPulse size={32} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-[0.2em] mb-1">Live Telemetry</p>
                  <p className="text-xl font-black text-[#1A2A4A] dark:text-[#E8EEF8]">Vitals Syncing</p>
                </div>
              </div>
            </div>

            <div className="absolute -left-12 bottom-1/4 z-30 bg-[#1A2A4A] dark:bg-[#0A122A] text-white p-10 rounded-[3.5rem] shadow-2xl animate-float-slow hidden xl:block border border-white/5">
               <div className="flex items-center gap-5 mb-6">
                  <ShieldCheck className="text-[#1E4A8A]" size={40} />
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 block">Identity Engine</span>
                    <span className="text-xl font-black tracking-tight">Verified Access</span>
                  </div>
               </div>
               <div className="flex gap-2">
                  {[1,2,3,4,5].map(i => <div key={i} className="w-2 h-2 bg-[#1E4A8A] rounded-full animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />)}
               </div>
            </div>
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="bg-white/50 dark:bg-[#111C3A]/50 backdrop-blur-md py-12 relative z-10 transition-colors duration-500 border-t border-[#D0DCE8] dark:border-[#1A2A4A]">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1E4A8A] rounded-xl flex items-center justify-center text-white">
              <Stethoscope size={20} />
            </div>
            <span className="text-lg font-black tracking-tighter text-[#1A2A4A] dark:text-[#E8EEF8]">MediCare</span>
          </div>
          <p className="text-[9px] font-black text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-[0.1em]">© 2026 Jimma Medical Center — Web-Based Patient Appointment Scheduling and Basic Medical Record Management System.</p>
          <div className="flex items-center gap-2">
             <div className="w-2 h-2 bg-[#2D8A6E] rounded-full animate-pulse" />
             <span className="text-[10px] font-black text-[#1A2A4A] dark:text-[#E8EEF8] uppercase tracking-widest">Global Status: Online</span>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes gradient-x {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 15s ease infinite;
        }
        @keyframes float-slow {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(1deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        .animate-float-slow {
          animation: float-slow 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div className="group cursor-default text-center lg:text-left">
      <p className="text-4xl font-black text-[#1A2A4A] dark:text-[#E8EEF8] tracking-tighter leading-none group-hover:text-[#1E4A8A] transition-colors">{value}</p>
      <p className="text-[10px] font-black text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-[0.2em] mt-3">{label}</p>
    </div>
  );
}
