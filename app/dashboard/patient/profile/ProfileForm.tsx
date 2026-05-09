// app/dashboard/patient/profile/ProfileForm.tsx
"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { Phone, Lock, Loader2, Save, AlertCircle } from "lucide-react";

export default function ProfileForm({ initialPhone }: { initialPhone: string }) {
  const [phone, setPhone] = useState(initialPhone);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password && password !== confirmPassword) {
      return toast.error("Passwords do not match");
    }

    setLoading(true);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          ...(password ? { password } : {}),
        }),
      });

      if (res.ok) {
        toast.success("Profile updated successfully!");
        setPassword("");
        setConfirmPassword("");
      } else {
        const error = await res.json();
        toast.error(error.message || "Failed to update profile");
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleUpdate} className="space-y-8">
      <div className="space-y-4">
        <label className="flex items-center gap-2 text-sm font-black text-slate-800 uppercase tracking-widest">
          <Phone size={18} className="text-blue-600" />
          Contact Phone
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-600 outline-none transition-all font-bold text-slate-900"
          required
        />
      </div>

      <div className="pt-8 border-t border-slate-50 space-y-6">
        <div className="flex items-center gap-2 text-sm font-black text-slate-800 uppercase tracking-widest">
          <Lock size={18} className="text-orange-500" />
          Change Password
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave blank to keep current"
              className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-orange-500 outline-none transition-all font-bold text-slate-900"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-orange-500 outline-none transition-all font-bold text-slate-900"
            />
          </div>
        </div>
      </div>

      <div className="bg-blue-50 p-6 rounded-2xl flex items-start gap-4">
        <AlertCircle className="text-blue-600 shrink-0" size={20} />
        <p className="text-xs text-blue-700 font-medium leading-relaxed">
          Security Note: Updating your phone number ensures hospital staff can reach you for urgent appointment changes. Your password must be at least 8 characters long.
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-xl shadow-2xl shadow-slate-200 hover:bg-slate-800 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
      >
        {loading ? <Loader2 className="animate-spin" /> : <Save />}
        Save Profile Changes
      </button>
    </form>
  );
}
