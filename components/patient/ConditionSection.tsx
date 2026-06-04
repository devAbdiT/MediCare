// components/patient/ConditionSection.tsx
"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { Activity, Plus, Loader2, X, CheckCircle2, Clock } from "lucide-react";

interface MedicalCondition {
  id: string;
  name: string;
  icdCode: string | null;
  diagnosedAt: string | null;
  isActive: boolean;
  notes: string | null;
}

interface Props {
  patientId: string;
  initialConditions: MedicalCondition[];
  canWrite: boolean;
}

export default function ConditionSection({ patientId, initialConditions, canWrite }: Props) {
  const [conditions, setConditions] = useState<MedicalCondition[]>(initialConditions);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    icdCode: "",
    diagnosedAt: "",
    isActive: true,
    notes: "",
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Condition name is required");

    setSaving(true);
    try {
      const res = await fetch(`/api/patients/${patientId}/conditions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          icdCode: form.icdCode.trim() || null,
          diagnosedAt: form.diagnosedAt || null,
          isActive: form.isActive,
          notes: form.notes.trim() || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add condition");
      }

      const newCondition = await res.json();
      setConditions((prev) => [newCondition, ...prev]);
      setForm({ name: "", icdCode: "", diagnosedAt: "", isActive: true, notes: "" });
      setShowForm(false);
      toast.success(`${form.name} condition recorded`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const activeConditions = conditions.filter((c) => c.isActive);
  const pastConditions = conditions.filter((c) => !c.isActive);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity size={18} className="text-blue-500" />
          <span className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest">
            Medical Conditions ({conditions.length})
          </span>
        </div>
        {canWrite && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 px-4 py-2 bg-[#1E3A5F] hover:bg-[#162d4a] text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all"
          >
            {showForm ? <X size={14} /> : <Plus size={14} />}
            {showForm ? "Cancel" : "Add Condition"}
          </button>
        )}
      </div>

      {/* Add Form */}
      {showForm && canWrite && (
        <form
          onSubmit={handleAdd}
          className="p-6 rounded-2xl border-2 border-dashed border-[#1E3A5F]/30 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest">
                Condition Name *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Type 2 Diabetes, Hypertension, Asthma"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm font-medium outline-none focus:border-[#1E3A5F] dark:focus:border-blue-500 transition-colors"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest">
                ICD Code
              </label>
              <input
                type="text"
                value={form.icdCode}
                onChange={(e) => setForm((f) => ({ ...f, icdCode: e.target.value }))}
                placeholder="e.g. E11, I10, J45"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm font-medium outline-none focus:border-[#1E3A5F] dark:focus:border-blue-500 transition-colors"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest">
                Diagnosed Date
              </label>
              <input
                type="date"
                value={form.diagnosedAt}
                onChange={(e) => setForm((f) => ({ ...f, diagnosedAt: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm font-medium outline-none focus:border-[#1E3A5F] dark:focus:border-blue-500 transition-colors"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest">
                Notes
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Any additional clinical notes..."
                rows={2}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm font-medium outline-none focus:border-[#1E3A5F] dark:focus:border-blue-500 transition-colors resize-none"
              />
            </div>
            <div className="flex items-center gap-3 md:col-span-2">
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
                className={`w-12 h-6 rounded-full transition-all duration-300 relative ${
                  form.isActive ? "bg-green-500" : "bg-slate-300 dark:bg-slate-600"
                }`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-300 ${
                    form.isActive ? "left-6" : "left-0.5"
                  }`}
                />
              </button>
              <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                {form.isActive ? "Active condition" : "Past / resolved condition"}
              </span>
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-[#1E3A5F] hover:bg-[#162d4a] text-white text-sm font-black rounded-xl transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            Record Condition
          </button>
        </form>
      )}

      {/* Conditions List */}
      {conditions.length === 0 ? (
        <div className="text-center py-10 text-slate-400 dark:text-slate-500">
          <Activity size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No medical conditions recorded</p>
        </div>
      ) : (
        <div className="space-y-6">
          {activeConditions.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-black text-green-600 dark:text-green-400 uppercase tracking-widest flex items-center gap-1.5">
                <CheckCircle2 size={12} /> Active
              </p>
              {activeConditions.map((cond) => (
                <ConditionCard key={cond.id} condition={cond} />
              ))}
            </div>
          )}
          {pastConditions.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <Clock size={12} /> Past / Resolved
              </p>
              {pastConditions.map((cond) => (
                <ConditionCard key={cond.id} condition={cond} past />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ConditionCard({ condition, past }: { condition: MedicalCondition; past?: boolean }) {
  return (
    <div
      className={`p-4 rounded-2xl border transition-all ${
        past
          ? "bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700 opacity-70"
          : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-black ${past ? "text-slate-600 dark:text-slate-400" : "text-slate-800 dark:text-slate-100"}`}>
              {condition.name}
            </span>
            {condition.icdCode && (
              <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                ICD: {condition.icdCode}
              </span>
            )}
          </div>
          {condition.diagnosedAt && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Diagnosed: {new Date(condition.diagnosedAt).toLocaleDateString()}
            </p>
          )}
          {condition.notes && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">{condition.notes}</p>
          )}
        </div>
      </div>
    </div>
  );
}
