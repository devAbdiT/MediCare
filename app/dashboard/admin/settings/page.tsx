"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { 
  Building2, MapPin, Phone, Mail, Clock, Calendar, 
  Banknote, Save, Loader2 
} from "lucide-react";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    clinicName: "",
    clinicAddress: "",
    clinicPhone: "",
    clinicEmail: "",
    workingHoursStart: "",
    workingHoursEnd: "",
    workingDays: [] as number[],
    appointmentDurationMins: 30,
    currency: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        setSettings(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: name === "appointmentDurationMins" ? Number(value) : value,
    }));
  };

  const toggleDay = (day: number) => {
    setSettings((prev) => ({
      ...prev,
      workingDays: prev.workingDays.includes(day)
        ? prev.workingDays.filter((d) => d !== day)
        : [...prev.workingDays, day].sort(),
    }));
  };

  if (loading) {
    return (
      <DashboardLayout role="admin">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-[#1E4A8A]" size={32} />
        </div>
      </DashboardLayout>
    );
  }

  const daysOfWeek = [
    { id: 1, name: "Mon" },
    { id: 2, name: "Tue" },
    { id: 3, name: "Wed" },
    { id: 4, name: "Thu" },
    { id: 5, name: "Fri" },
    { id: 6, name: "Sat" },
    { id: 0, name: "Sun" },
  ];

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8 max-w-5xl mx-auto pb-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-black text-[#1A2A4A] dark:text-[#E8EEF8] tracking-tight">System Settings</h1>
            <p className="text-[#5A6E8A] dark:text-[#8A9CBA] font-medium">Configure global clinic parameters and defaults.</p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-[#1E4A8A] hover:bg-[#16386b] text-white font-bold rounded-2xl transition-colors disabled:opacity-70 shadow-lg shadow-[#1E4A8A]/20"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Save Settings
          </button>
        </div>

        {saveSuccess && (
          <div className="bg-emerald-50 text-emerald-600 border border-emerald-200 px-4 py-3 rounded-2xl flex items-center gap-2 animate-in slide-in-from-top-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-bold text-sm">Settings saved successfully! Changes will apply to all new documents.</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Clinic Information */}
          <div className="bg-white dark:bg-[#111C3A] p-8 rounded-[2.5rem] border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-[#F0F4F8] dark:border-[#1A2A4A] pb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-[#1E4A8A]/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Building2 size={20} />
              </div>
              <h2 className="text-xl font-bold text-[#1A2A4A] dark:text-[#E8EEF8]">Clinic Information</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-[#5A6E8A] dark:text-[#8A9CBA] tracking-widest flex items-center gap-2">
                  Clinic Name
                </label>
                <input
                  type="text"
                  name="clinicName"
                  value={settings.clinicName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-[#F0F4F8] dark:bg-[#0A122A] border-none rounded-xl text-sm font-medium text-[#1A2A4A] dark:text-[#E8EEF8] focus:ring-2 focus:ring-[#1E4A8A]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-[#5A6E8A] dark:text-[#8A9CBA] tracking-widest flex items-center gap-2">
                  <MapPin size={14} /> Address
                </label>
                <input
                  type="text"
                  name="clinicAddress"
                  value={settings.clinicAddress}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-[#F0F4F8] dark:bg-[#0A122A] border-none rounded-xl text-sm font-medium text-[#1A2A4A] dark:text-[#E8EEF8] focus:ring-2 focus:ring-[#1E4A8A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-[#5A6E8A] dark:text-[#8A9CBA] tracking-widest flex items-center gap-2">
                    <Phone size={14} /> Phone
                  </label>
                  <input
                    type="text"
                    name="clinicPhone"
                    value={settings.clinicPhone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-[#F0F4F8] dark:bg-[#0A122A] border-none rounded-xl text-sm font-medium text-[#1A2A4A] dark:text-[#E8EEF8] focus:ring-2 focus:ring-[#1E4A8A]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-[#5A6E8A] dark:text-[#8A9CBA] tracking-widest flex items-center gap-2">
                    <Mail size={14} /> Email
                  </label>
                  <input
                    type="email"
                    name="clinicEmail"
                    value={settings.clinicEmail}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-[#F0F4F8] dark:bg-[#0A122A] border-none rounded-xl text-sm font-medium text-[#1A2A4A] dark:text-[#E8EEF8] focus:ring-2 focus:ring-[#1E4A8A]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Working Hours */}
          <div className="bg-white dark:bg-[#111C3A] p-8 rounded-[2.5rem] border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-[#F0F4F8] dark:border-[#1A2A4A] pb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Clock size={20} />
              </div>
              <h2 className="text-xl font-bold text-[#1A2A4A] dark:text-[#E8EEF8]">Working Hours</h2>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-[#5A6E8A] dark:text-[#8A9CBA] tracking-widest">Opening Time</label>
                  <input
                    type="time"
                    name="workingHoursStart"
                    value={settings.workingHoursStart}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-[#F0F4F8] dark:bg-[#0A122A] border-none rounded-xl text-sm font-medium text-[#1A2A4A] dark:text-[#E8EEF8] focus:ring-2 focus:ring-[#1E4A8A]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-[#5A6E8A] dark:text-[#8A9CBA] tracking-widest">Closing Time</label>
                  <input
                    type="time"
                    name="workingHoursEnd"
                    value={settings.workingHoursEnd}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-[#F0F4F8] dark:bg-[#0A122A] border-none rounded-xl text-sm font-medium text-[#1A2A4A] dark:text-[#E8EEF8] focus:ring-2 focus:ring-[#1E4A8A]"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold uppercase text-[#5A6E8A] dark:text-[#8A9CBA] tracking-widest">Working Days</label>
                <div className="flex flex-wrap gap-2">
                  {daysOfWeek.map((day) => (
                    <button
                      key={day.id}
                      onClick={() => toggleDay(day.id)}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                        settings.workingDays.includes(day.id)
                          ? "bg-[#1E4A8A] text-white"
                          : "bg-[#F0F4F8] dark:bg-[#0A122A] text-[#5A6E8A] dark:text-[#8A9CBA] hover:bg-[#E2E8F0]"
                      }`}
                    >
                      {day.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Appointment Settings */}
          <div className="bg-white dark:bg-[#111C3A] p-8 rounded-[2.5rem] border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-[#F0F4F8] dark:border-[#1A2A4A] pb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Calendar size={20} />
              </div>
              <h2 className="text-xl font-bold text-[#1A2A4A] dark:text-[#E8EEF8]">Appointment Settings</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-[#5A6E8A] dark:text-[#8A9CBA] tracking-widest">
                  Default Duration (Minutes)
                </label>
                <select
                  name="appointmentDurationMins"
                  value={settings.appointmentDurationMins}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-[#F0F4F8] dark:bg-[#0A122A] border-none rounded-xl text-sm font-medium text-[#1A2A4A] dark:text-[#E8EEF8] focus:ring-2 focus:ring-[#1E4A8A]"
                >
                  <option value={15}>15 Minutes</option>
                  <option value={20}>20 Minutes</option>
                  <option value={30}>30 Minutes</option>
                  <option value={45}>45 Minutes</option>
                  <option value={60}>60 Minutes</option>
                </select>
              </div>
            </div>
          </div>

          {/* Financial Settings */}
          <div className="bg-white dark:bg-[#111C3A] p-8 rounded-[2.5rem] border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-[#F0F4F8] dark:border-[#1A2A4A] pb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Banknote size={20} />
              </div>
              <h2 className="text-xl font-bold text-[#1A2A4A] dark:text-[#E8EEF8]">Financial Settings</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-[#5A6E8A] dark:text-[#8A9CBA] tracking-widest">
                  Primary Currency
                </label>
                <select
                  name="currency"
                  value={settings.currency}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-[#F0F4F8] dark:bg-[#0A122A] border-none rounded-xl text-sm font-medium text-[#1A2A4A] dark:text-[#E8EEF8] focus:ring-2 focus:ring-[#1E4A8A]"
                >
                  <option value="ETB">ETB (Ethiopian Birr)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
