"use client";

import React, { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { User, Lock, Mail, Bell, Shield, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function SharedSettings({ role }: { role: "admin" | "doctor" | "receptionist" | "patient" }) {
  const [loading, setLoading] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate save
    setTimeout(() => {
      setLoading(false);
      toast.success("Settings saved successfully!");
    }, 1000);
  };

  return (
    <DashboardLayout role={role}>
      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Account Settings</h1>
          <p className="text-slate-500 mt-2 text-lg font-medium">Manage your personal information and system preferences.</p>
        </div>

        <form onSubmit={handleSave} className="space-y-8">
          <div className="bg-white dark:bg-[#111C3A] p-8 rounded-[2.5rem] border border-slate-100 dark:border-[#1A2A4A] shadow-sm space-y-6">
            <h2 className="text-xl font-black flex items-center gap-2 text-slate-900 dark:text-white">
              <User className="text-blue-600" />
              Personal Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                <input
                  type="text"
                  placeholder="Update your name"
                  className="w-full p-4 bg-slate-50 dark:bg-[#0A122A] border-2 border-transparent rounded-2xl focus:bg-white dark:focus:bg-[#111C3A] focus:border-blue-600 outline-none transition-all font-medium text-slate-900 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                <input
                  type="email"
                  placeholder="Update your email"
                  className="w-full p-4 bg-slate-50 dark:bg-[#0A122A] border-2 border-transparent rounded-2xl focus:bg-white dark:focus:bg-[#111C3A] focus:border-blue-600 outline-none transition-all font-medium text-slate-900 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="Update your phone"
                  className="w-full p-4 bg-slate-50 dark:bg-[#0A122A] border-2 border-transparent rounded-2xl focus:bg-white dark:focus:bg-[#111C3A] focus:border-blue-600 outline-none transition-all font-medium text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#111C3A] p-8 rounded-[2.5rem] border border-slate-100 dark:border-[#1A2A4A] shadow-sm space-y-6">
            <h2 className="text-xl font-black flex items-center gap-2 text-slate-900 dark:text-white">
              <Lock className="text-blue-600" />
              Security
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Current Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full p-4 bg-slate-50 dark:bg-[#0A122A] border-2 border-transparent rounded-2xl focus:bg-white dark:focus:bg-[#111C3A] focus:border-blue-600 outline-none transition-all font-medium text-slate-900 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">New Password</label>
                <input
                  type="password"
                  placeholder="Leave blank to keep same"
                  className="w-full p-4 bg-slate-50 dark:bg-[#0A122A] border-2 border-transparent rounded-2xl focus:bg-white dark:focus:bg-[#111C3A] focus:border-blue-600 outline-none transition-all font-medium text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#111C3A] p-8 rounded-[2.5rem] border border-slate-100 dark:border-[#1A2A4A] shadow-sm space-y-6">
            <h2 className="text-xl font-black flex items-center gap-2 text-slate-900 dark:text-white">
              <Bell className="text-blue-600" />
              Preferences
            </h2>
            
            <div className="space-y-4">
              <label className="flex items-center gap-4 p-4 border border-slate-100 dark:border-[#1A2A4A] rounded-2xl cursor-pointer hover:bg-slate-50 dark:hover:bg-[#0A122A] transition-colors">
                <input type="checkbox" className="w-5 h-5 accent-blue-600" defaultChecked />
                <span className="font-bold text-slate-900 dark:text-white">Email Notifications</span>
              </label>
              <label className="flex items-center gap-4 p-4 border border-slate-100 dark:border-[#1A2A4A] rounded-2xl cursor-pointer hover:bg-slate-50 dark:hover:bg-[#0A122A] transition-colors">
                <input type="checkbox" className="w-5 h-5 accent-blue-600" defaultChecked />
                <span className="font-bold text-slate-900 dark:text-white">System Alerts</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={loading}
              className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
