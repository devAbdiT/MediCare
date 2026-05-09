// app/page.tsx
import Link from "next/link";
import { Stethoscope, ArrowRight, ShieldCheck, HeartPulse, ClipboardCheck } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="flex items-center justify-between p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 text-blue-600 font-black text-2xl">
          <Stethoscope size={32} />
          <span>MediCare</span>
        </div>
        <div className="flex gap-4">
          <Link href="/login" className="px-6 py-3 font-bold text-slate-600 hover:text-slate-900 transition-colors">
            Login
          </Link>
          <Link href="/login" className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="max-w-7xl mx-auto px-6 py-20 lg:py-32 flex flex-col items-center text-center">
        <div className="inline-block px-4 py-2 bg-blue-50 text-blue-600 rounded-full font-bold text-sm mb-6 uppercase tracking-widest">
          Next-Gen Patient Management
        </div>
        <h1 className="text-5xl lg:text-7xl font-black text-slate-900 mb-8 leading-tight">
          Modernizing healthcare <br />
          <span className="text-blue-600 underline underline-offset-8">one visit at a time.</span>
        </h1>
        <p className="max-w-2xl text-slate-500 text-xl font-medium mb-12">
          A seamless experience for patients, a powerful tool for doctors, and a comprehensive platform for hospital administrators.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-20">
          <Link href="/login" className="px-10 py-5 bg-slate-900 text-white rounded-2xl font-black text-lg flex items-center gap-2 shadow-2xl hover:bg-slate-800 transition-all group">
            Launch Platform
            <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <button className="px-10 py-5 bg-white border-2 border-slate-100 text-slate-600 rounded-2xl font-black text-lg hover:border-blue-100 transition-all">
            View Live Demo
          </button>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
          <Feature 
            icon={<ShieldCheck size={32} className="text-blue-600" />} 
            title="Role-Based Security" 
            desc="Encrypted access tailored for Doctors, Receptionists, and Patients." 
          />
          <Feature 
            icon={<HeartPulse size={32} className="text-red-500" />} 
            title="Clinical Efficiency" 
            desc="Intuitive dashboards that let doctors focus on care, not paperwork." 
          />
          <Feature 
            icon={<ClipboardCheck size={32} className="text-emerald-500" />} 
            title="Unified Records" 
            desc="One source of truth for patient history, prescriptions, and visits." 
          />
        </div>
      </main>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-transparent hover:border-blue-100 transition-all text-left">
      <div className="mb-6">{icon}</div>
      <h3 className="text-xl font-black text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-500 font-medium leading-relaxed">{desc}</p>
    </div>
  );
}
