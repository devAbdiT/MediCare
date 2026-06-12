// components/doctor/VitalsForm.tsx
"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, Heart, Activity, AlertTriangle, Edit2, Check } from "lucide-react";

interface VitalsFormProps {
  appointmentId: string;
  patientId: string;
  onSaveSuccess?: () => void;
}

export default function VitalsForm({ appointmentId, patientId, onSaveSuccess }: VitalsFormProps) {
  const [loading, setLoading] = useState(true);
  const [isEdit, setIsEdit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [vitals, setVitals] = useState<any>(null);

  // Form states
  const [formData, setFormData] = useState({
    bloodPressureSys: "",
    bloodPressureDia: "",
    temperature: "",
    weight: "",
    height: "",
    pulseRate: "",
    oxygenSaturation: "",
    respiratoryRate: ""
  });

  const fetchVitals = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/vitals?appointmentId=${appointmentId}`);
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setVitals(data);
          setFormData({
            bloodPressureSys: data.bloodPressureSys ? String(data.bloodPressureSys) : "",
            bloodPressureDia: data.bloodPressureDia ? String(data.bloodPressureDia) : "",
            temperature: data.temperature ? String(data.temperature) : "",
            weight: data.weight ? String(data.weight) : "",
            height: data.height ? String(data.height) : "",
            pulseRate: data.pulseRate ? String(data.pulseRate) : "",
            oxygenSaturation: data.oxygenSaturation ? String(data.oxygenSaturation) : "",
            respiratoryRate: data.respiratoryRate ? String(data.respiratoryRate) : ""
          });
          setIsEdit(false);
        } else {
          setVitals(null);
          setIsEdit(true);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch vital signs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (appointmentId) {
      fetchVitals();
    }
  }, [appointmentId]);

  // Validation / Normal Ranges helpers
  const isBPOutOfRange = (sys: string, dia: string) => {
    const s = parseInt(sys, 10);
    const d = parseInt(dia, 10);
    if (!isNaN(s) && (s < 90 || s > 120)) return true;
    if (!isNaN(d) && (d < 60 || d > 80)) return true;
    return false;
  };

  const isTempOutOfRange = (temp: string) => {
    const t = parseFloat(temp);
    return !isNaN(t) && (t < 36.1 || t > 37.2);
  };

  const isPulseOutOfRange = (pulse: string) => {
    const p = parseInt(pulse, 10);
    return !isNaN(p) && (p < 60 || p > 100);
  };

  const isO2OutOfRange = (o2: string) => {
    const o = parseFloat(o2);
    return !isNaN(o) && o < 95;
  };

  const isRespOutOfRange = (resp: string) => {
    const r = parseInt(resp, 10);
    return !isNaN(r) && (r < 12 || r > 20);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch("/api/vitals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId,
          patientId,
          ...formData
        })
      });

      if (res.ok) {
        toast.success("Vital signs saved successfully!");
        fetchVitals();
        if (onSaveSuccess) onSaveSuccess();
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Failed to save vitals");
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#111C3A] p-8 rounded-[2rem] border border-[#D0DCE8] dark:border-[#1A2A4A] flex justify-center items-center py-10">
        <Loader2 className="animate-spin text-[#1E4A8A]" size={30} />
      </div>
    );
  }

  // --- Summary View ---
  if (vitals && !isEdit) {
    const hasWarning =
      isBPOutOfRange(String(vitals.bloodPressureSys), String(vitals.bloodPressureDia)) ||
      isTempOutOfRange(String(vitals.temperature)) ||
      isPulseOutOfRange(String(vitals.pulseRate)) ||
      isO2OutOfRange(String(vitals.oxygenSaturation)) ||
      isRespOutOfRange(String(vitals.respiratoryRate));

    return (
      <div className="bg-white dark:bg-[#111C3A] rounded-[2.5rem] border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-sm overflow-hidden transition-all duration-300">
        <div className="p-8 border-b border-[#D0DCE8] dark:border-[#1A2A4A] bg-[#F8FAFC] dark:bg-[#0E1730] flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black text-[#1A2A4A] dark:text-[#E8EEF8] flex items-center gap-2">
              <Heart className="text-[#D94A5A] fill-[#D94A5A]" size={20} />
              Step 1: Vital Signs
            </h2>
            <p className="text-[10px] font-black text-[#5A6E8A] uppercase tracking-wider mt-1">Recorded Patient Baselines</p>
          </div>
          <button
            onClick={() => setIsEdit(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-[#111C3A] border border-[#D0DCE8] dark:border-[#1A2A4A] hover:bg-[#F0F4F8] dark:hover:bg-[#0A122A] text-xs font-black text-[#1E4A8A] dark:text-[#4A8AC8] rounded-xl transition-all shadow-sm active:scale-95"
          >
            <Edit2 size={12} />
            Edit Vitals
          </button>
        </div>

        <div className="p-8 space-y-6">
          {hasWarning && (
            <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-2xl">
              <AlertTriangle size={18} />
              <span className="text-xs font-bold">Alert: One or more patient baseline signs fall outside normal clinical ranges.</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* BP */}
            <VitalsMetricCard
              label="Blood Pressure"
              value={
                vitals.bloodPressureSys && vitals.bloodPressureDia
                  ? `${vitals.bloodPressureSys}/${vitals.bloodPressureDia}`
                  : "N/A"
              }
              unit="mmHg"
              isAbnormal={isBPOutOfRange(String(vitals.bloodPressureSys), String(vitals.bloodPressureDia))}
              normalRange="90-120 / 60-80"
            />
            {/* Temp */}
            <VitalsMetricCard
              label="Temperature"
              value={vitals.temperature ? Number(vitals.temperature).toFixed(1) : "N/A"}
              unit="°C"
              isAbnormal={isTempOutOfRange(String(vitals.temperature))}
              normalRange="36.1 - 37.2"
            />
            {/* Pulse */}
            <VitalsMetricCard
              label="Pulse Rate"
              value={vitals.pulseRate ? String(vitals.pulseRate) : "N/A"}
              unit="bpm"
              isAbnormal={isPulseOutOfRange(String(vitals.pulseRate))}
              normalRange="60 - 100"
            />
            {/* O2 */}
            <VitalsMetricCard
              label="Oxygen Saturation"
              value={vitals.oxygenSaturation ? Number(vitals.oxygenSaturation).toFixed(0) : "N/A"}
              unit="%"
              isAbnormal={isO2OutOfRange(String(vitals.oxygenSaturation))}
              normalRange="95 - 100"
            />
            {/* Respiratory */}
            <VitalsMetricCard
              label="Respiratory Rate"
              value={vitals.respiratoryRate ? String(vitals.respiratoryRate) : "N/A"}
              unit="/min"
              isAbnormal={isRespOutOfRange(String(vitals.respiratoryRate))}
              normalRange="12 - 20"
            />
            {/* Weight / Height */}
            <div className="p-5 bg-[#F8FAFC] dark:bg-[#0E1730] rounded-2xl border border-[#D0DCE8] dark:border-[#1A2A4A] space-y-2">
              <span className="text-[10px] font-black text-[#5A6E8A] uppercase tracking-wider block">Physical Stats</span>
              <div className="flex justify-between items-center pt-1">
                <div>
                  <span className="text-xl font-black text-[#1A2A4A] dark:text-[#E8EEF8]">{vitals.weight || "N/A"}</span>
                  <span className="text-xs text-[#5A6E8A] font-bold ml-1">kg</span>
                </div>
                <div className="w-px h-6 bg-[#D0DCE8] dark:bg-[#1A2A4A]" />
                <div>
                  <span className="text-xl font-black text-[#1A2A4A] dark:text-[#E8EEF8]">{vitals.height || "N/A"}</span>
                  <span className="text-xs text-[#5A6E8A] font-bold ml-1">cm</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Form View ---
  return (
    <div className="bg-white dark:bg-[#111C3A] rounded-[2.5rem] border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-sm overflow-hidden transition-all duration-300">
      <div className="p-8 border-b border-[#D0DCE8] dark:border-[#1A2A4A] bg-[#F8FAFC] dark:bg-[#0E1730] flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-[#1A2A4A] dark:text-[#E8EEF8] flex items-center gap-2">
            <Activity className="text-[#1E4A8A] dark:text-[#4A8AC8]" size={20} />
            Step 1: Vital Signs
          </h2>
          <p className="text-[10px] font-black text-[#5A6E8A] uppercase tracking-wider mt-1">Record Patient Baselines</p>
        </div>
        {vitals && (
          <button
            type="button"
            onClick={() => setIsEdit(false)}
            className="flex items-center gap-1.5 px-4 py-2 border border-[#D0DCE8] dark:border-[#1A2A4A] hover:bg-[#F0F4F8] dark:hover:bg-[#0A122A] text-xs font-black text-[#5A6E8A] rounded-xl transition-all shadow-sm active:scale-95"
          >
            Cancel Edit
          </button>
        )}
      </div>

      <form onSubmit={handleSave} className="p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* BP Systolic / Diastolic */}
          <div className="space-y-2">
            <label className="text-xs font-black text-[#5A6E8A] uppercase tracking-wider">Blood Pressure (mmHg)</label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Sys"
                value={formData.bloodPressureSys}
                onChange={(e) => setFormData({ ...formData, bloodPressureSys: e.target.value })}
                className={`w-full p-4 bg-[#F0F4F8] dark:bg-[#0A122A] rounded-2xl border outline-none font-bold text-[#1A2A4A] dark:text-white transition-all ${
                  isBPOutOfRange(formData.bloodPressureSys, formData.bloodPressureDia)
                    ? "border-amber-500 focus:border-amber-600"
                    : "border-transparent focus:border-[#1E4A8A]"
                }`}
              />
              <span className="flex items-center font-bold text-[#5A6E8A] text-lg">/</span>
              <input
                type="number"
                placeholder="Dia"
                value={formData.bloodPressureDia}
                onChange={(e) => setFormData({ ...formData, bloodPressureDia: e.target.value })}
                className={`w-full p-4 bg-[#F0F4F8] dark:bg-[#0A122A] rounded-2xl border outline-none font-bold text-[#1A2A4A] dark:text-white transition-all ${
                  isBPOutOfRange(formData.bloodPressureSys, formData.bloodPressureDia)
                    ? "border-amber-500 focus:border-amber-600"
                    : "border-transparent focus:border-[#1E4A8A]"
                }`}
              />
            </div>
            <p className="text-[10px] text-slate-400 font-bold">Normal: 90-120 / 60-80</p>
          </div>

          {/* Temperature */}
          <div className="space-y-2">
            <label className="text-xs font-black text-[#5A6E8A] uppercase tracking-wider">Temperature (°C)</label>
            <input
              type="number"
              step="0.1"
              placeholder="e.g. 36.8"
              value={formData.temperature}
              onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
              className={`w-full p-4 bg-[#F0F4F8] dark:bg-[#0A122A] rounded-2xl border outline-none font-bold text-[#1A2A4A] dark:text-white transition-all ${
                isTempOutOfRange(formData.temperature)
                  ? "border-amber-500 focus:border-amber-600"
                  : "border-transparent focus:border-[#1E4A8A]"
              }`}
            />
            <p className="text-[10px] text-slate-400 font-bold">Normal: 36.1 - 37.2</p>
          </div>

          {/* Pulse Rate */}
          <div className="space-y-2">
            <label className="text-xs font-black text-[#5A6E8A] uppercase tracking-wider">Pulse Rate (bpm)</label>
            <input
              type="number"
              placeholder="e.g. 72"
              value={formData.pulseRate}
              onChange={(e) => setFormData({ ...formData, pulseRate: e.target.value })}
              className={`w-full p-4 bg-[#F0F4F8] dark:bg-[#0A122A] rounded-2xl border outline-none font-bold text-[#1A2A4A] dark:text-white transition-all ${
                isPulseOutOfRange(formData.pulseRate)
                  ? "border-amber-500 focus:border-amber-600"
                  : "border-transparent focus:border-[#1E4A8A]"
              }`}
            />
            <p className="text-[10px] text-slate-400 font-bold">Normal: 60 - 100</p>
          </div>

          {/* O2 Saturation */}
          <div className="space-y-2">
            <label className="text-xs font-black text-[#5A6E8A] uppercase tracking-wider">O2 Saturation (%)</label>
            <input
              type="number"
              step="0.1"
              placeholder="e.g. 98"
              value={formData.oxygenSaturation}
              onChange={(e) => setFormData({ ...formData, oxygenSaturation: e.target.value })}
              className={`w-full p-4 bg-[#F0F4F8] dark:bg-[#0A122A] rounded-2xl border outline-none font-bold text-[#1A2A4A] dark:text-white transition-all ${
                isO2OutOfRange(formData.oxygenSaturation)
                  ? "border-amber-500 focus:border-amber-600"
                  : "border-transparent focus:border-[#1E4A8A]"
              }`}
            />
            <p className="text-[10px] text-slate-400 font-bold">Normal: 95 - 100</p>
          </div>

          {/* Respiratory Rate */}
          <div className="space-y-2">
            <label className="text-xs font-black text-[#5A6E8A] uppercase tracking-wider">Respiratory Rate (/min)</label>
            <input
              type="number"
              placeholder="e.g. 16"
              value={formData.respiratoryRate}
              onChange={(e) => setFormData({ ...formData, respiratoryRate: e.target.value })}
              className={`w-full p-4 bg-[#F0F4F8] dark:bg-[#0A122A] rounded-2xl border outline-none font-bold text-[#1A2A4A] dark:text-white transition-all ${
                isRespOutOfRange(formData.respiratoryRate)
                  ? "border-amber-500 focus:border-amber-600"
                  : "border-transparent focus:border-[#1E4A8A]"
              }`}
            />
            <p className="text-[10px] text-slate-400 font-bold">Normal: 12 - 20</p>
          </div>

          {/* Weight */}
          <div className="space-y-2">
            <label className="text-xs font-black text-[#5A6E8A] uppercase tracking-wider">Weight (kg)</label>
            <input
              type="number"
              step="0.1"
              placeholder="e.g. 70"
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              className="w-full p-4 bg-[#F0F4F8] dark:bg-[#0A122A] rounded-2xl border border-transparent focus:border-[#1E4A8A] outline-none font-bold text-[#1A2A4A] dark:text-white"
            />
            <p className="text-[10px] text-slate-400 font-bold">Optional clinical baseline</p>
          </div>

          {/* Height */}
          <div className="space-y-2">
            <label className="text-xs font-black text-[#5A6E8A] uppercase tracking-wider">Height (cm)</label>
            <input
              type="number"
              step="0.1"
              placeholder="e.g. 175"
              value={formData.height}
              onChange={(e) => setFormData({ ...formData, height: e.target.value })}
              className="w-full p-4 bg-[#F0F4F8] dark:bg-[#0A122A] rounded-2xl border border-transparent focus:border-[#1E4A8A] outline-none font-bold text-[#1A2A4A] dark:text-white"
            />
            <p className="text-[10px] text-slate-400 font-bold">Optional clinical baseline</p>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="flex items-center justify-center gap-2 px-8 py-4 bg-[#1E4A8A] text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-[#0F3A6A] transition-all shadow-md shadow-[#1E4A8A]/10 active:scale-95 disabled:opacity-55"
        >
          {submitting ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
          Save Vitals
        </button>
      </form>
    </div>
  );
}

function VitalsMetricCard({
  label,
  value,
  unit,
  isAbnormal,
  normalRange
}: {
  label: string;
  value: string;
  unit: string;
  isAbnormal: boolean;
  normalRange: string;
}) {
  return (
    <div className={`p-5 rounded-2xl border transition-all ${
      isAbnormal
        ? "bg-amber-50/50 dark:bg-amber-950/10 border-amber-300 dark:border-amber-900"
        : "bg-[#F8FAFC] dark:bg-[#0E1730] border-[#D0DCE8] dark:border-[#1A2A4A]"
    }`}>
      <span className="text-[10px] font-black text-[#5A6E8A] uppercase tracking-wider block">{label}</span>
      <div className="flex items-baseline gap-1 mt-1.5">
        <span className={`text-2xl font-black tracking-tight ${isAbnormal ? "text-amber-600 dark:text-amber-400" : "text-[#1A2A4A] dark:text-[#E8EEF8]"}`}>
          {value}
        </span>
        <span className="text-xs font-bold text-[#5A6E8A]">{unit}</span>
        {isAbnormal && (
          <span className="ml-auto inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-md">
            Abnormal
          </span>
        )}
      </div>
      <p className="text-[9px] text-[#5A6E8A]/50 font-bold mt-1">Normal: {normalRange} {unit}</p>
    </div>
  );
}
