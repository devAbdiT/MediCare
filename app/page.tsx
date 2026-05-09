// app/page.tsx
import React from "react";
import Link from "next/link";
import { Stethoscope, ArrowRight, ShieldCheck, HeartPulse, ClipboardCheck, Sparkles, Activity } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] overflow-hidden relative selection:bg-blue-100 selection:text-blue-900">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-gradient-to-br from-blue-100/50 to-emerald-50/30 rounded-full blur-[150px] -mr-96 -mt-96 animate-pulse" />
      <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-gradient-to-tr from-blue-50/50 to-indigo-50/30 rounded-full blur-[120px] -ml-48 -mb-48" />

      {/* Premium Glass Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-[100] px-8 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between bg-white/70 backdrop-blur-2xl border border-white/20 px-8 py-4 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex items-center gap-3 text-blue-600 font-black text-2xl tracking-tighter">
            <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <Stethoscope size={24} />
            </div>
            <span className="hidden sm:block">MediCare</span>
          </div>
          <div className="flex items-center gap-8">
            <Link href="/login" className="hidden lg:block font-black text-slate-500 hover:text-blue-600 transition-colors uppercase tracking-widest text-[10px]">
              System Status
            </Link>
            <Link href="/login" className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black shadow-2xl shadow-slate-200 hover:bg-blue-600 hover:scale-105 active:scale-95 transition-all text-xs uppercase tracking-widest">
              Login to Portal
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-8 pt-40 pb-32 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-24">
          {/* Left Content */}
          <div className="flex-1 text-center lg:text-left space-y-10">
            <div className="inline-flex items-center gap-2 px-5 py-2 bg-blue-50 rounded-full border border-blue-100/50">
              <Activity className="text-blue-600 animate-pulse" size={16} />
              <span className="text-[10px] font-black text-blue-700 uppercase tracking-[0.2em]">Live Clinical OS v2.0</span>
            </div>
            
            <h1 className="text-7xl lg:text-9xl font-black text-slate-900 leading-[0.85] tracking-tighter">
              Healthy <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-500">Excellence.</span>
            </h1>
            
            <p className="max-w-xl text-slate-500 text-xl font-medium leading-relaxed">
              Experience the future of healthcare management with our elite operating system for patients and medical professionals.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start pt-4">
              <Link href="/login" className="px-12 py-7 bg-blue-600 text-white rounded-[2.5rem] font-black text-xl flex items-center justify-center gap-3 shadow-[0_20px_40px_-10px_rgba(37,99,235,0.3)] hover:bg-blue-700 hover:-translate-y-1 transition-all group">
                Enter Platform
                <ArrowRight size={28} className="group-hover:translate-x-2 transition-transform" />
              </Link>
              <button className="px-12 py-7 bg-white border-2 border-slate-100 text-slate-900 rounded-[2.5rem] font-black text-xl hover:border-blue-600 hover:bg-blue-50/30 transition-all">
                System Tour
              </button>
            </div>

            <div className="flex items-center gap-12 pt-8 border-t border-slate-100">
              <StatItem value="100%" label="Uptime" />
              <StatItem value="Secure" label="Encrypted" />
              <StatItem value="Role" label="Integrated" />
            </div>
          </div>

          {/* Right Visual */}
          <div className="flex-1 relative group">
            <div className="relative z-10 transition-transform duration-700 group-hover:scale-[1.02] animate-float">
              <img 
                src="/premium_3d_doctor_mascot_1778335022307.png" 
                alt="Elite Doctor Mascot"
                className="w-full h-auto drop-shadow-[0_50px_50px_rgba(0,0,0,0.12)] rounded-[4rem] border-4 border-white"
              />
            </div>

            <div className="absolute -right-12 top-1/4 z-20 bg-white/90 backdrop-blur-2xl p-6 rounded-[2.5rem] border border-white/50 shadow-2xl animate-bounce hidden xl:block">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-100">
                  <HeartPulse size={28} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pulse Check</p>
                  <p className="text-lg font-black text-slate-900">Normal Range</p>
                </div>
              </div>
            </div>

            <div className="absolute -left-12 bottom-1/4 z-20 bg-slate-900 text-white p-8 rounded-[3rem] shadow-2xl animate-float hidden xl:block">
               <div className="flex items-center gap-4 mb-4">
                  <ShieldCheck className="text-blue-400" size={32} />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Verified Secure</span>
               </div>
               <p className="text-xl font-black tracking-tight">Data Vault Active</p>
            </div>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-40">
          <FeatureCard 
            icon={<Activity />} 
            title="Real-time Vitals" 
            desc="Instant synchronization across all medical devices and profiles."
            gradient="from-blue-600 to-blue-400"
          />
          <FeatureCard 
            icon={<ClipboardCheck />} 
            title="Atomic Records" 
            desc="Every prescription and diagnosis is handled with total precision."
            gradient="from-emerald-600 to-teal-400"
          />
          <FeatureCard 
            icon={<Sparkles />} 
            title="AI Insights" 
            desc="Smart alerts for medication conflicts and appointment optimization."
            gradient="from-indigo-600 to-blue-400"
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-start gap-12">
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-blue-600 font-black text-2xl tracking-tighter">
              <Stethoscope size={32} />
              <span>MediCare</span>
            </div>
            <p className="max-w-xs text-slate-400 font-medium leading-relaxed">
              The world's most advanced patient management system for modern clinics.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-16">
            <FooterCol title="Platform" links={["Features", "Security", "Uptime"]} />
            <FooterCol title="Medical" links={["Doctors", "Records", "Pharmacy"]} />
            <FooterCol title="Company" links={["About", "Privacy", "Terms"]} />
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-8 mt-20 pt-8 border-t border-slate-50 text-center">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">© 2026 MediCare Elite Cloud. Engineered for Excellence.</p>
        </div>
      </footer>
    </div>
  );
}

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{value}</p>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">{label}</p>
    </div>
  );
}

function FeatureCard({ icon, title, desc, gradient }: { icon: React.ReactNode; title: string; desc: string; gradient: string }) {
  return (
    <div className="group bg-white p-12 rounded-[3.5rem] border border-slate-100 hover:border-blue-200 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] relative overflow-hidden">
      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 transition-opacity rounded-bl-[4rem]`} />
      <div className={`w-16 h-16 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center text-white mb-8 shadow-xl group-hover:scale-110 transition-transform duration-500`}>
        {React.cloneElement(icon as React.ReactElement, { size: 32 })}
      </div>
      <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">{title}</h3>
      <p className="text-slate-500 font-medium leading-relaxed">{desc}</p>
    </div>
  );
}

function FooterCol({ title, links }: { title: string; links: string[] }) {
  return (
    <div className="space-y-6">
      <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{title}</h4>
      <ul className="space-y-4">
        {links.map(link => (
          <li key={link}>
            <a href="#" className="text-sm font-bold text-slate-400 hover:text-blue-600 transition-colors">{link}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
