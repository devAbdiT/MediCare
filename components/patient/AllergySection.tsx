// components/patient/AllergySection.tsx
"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Plus, Trash2, Loader2, ShieldAlert, X } from "lucide-react";

interface Allergy {
  id: string;
  allergen: string;
  severity: "MILD" | "MODERATE" | "SEVERE" | "LIFE_THREATENING";
  reaction: string | null;
  confirmedAt: string | null;
}

interface Props {
  patientId: string;
  initialAllergies: Allergy[];
  canWrite: boolean; // DOCTOR, RECEPTIONIST, ADMIN
}

const SEVERITY_CONFIG = {
  MILD: {
    label: "Mild",
    bg: "bg-yellow-50 dark:bg-yellow-900/20",
    border: "border-yellow-300 dark:border-yellow-700",
    text: "text-yellow-700 dark:text-yellow-400",
    badge: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
    dot: "bg-yellow-400",
  },
  MODERATE: {
    label: "Moderate",
    bg: "bg-orange-50 dark:bg-orange-900/20",
    border: "border-orange-300 dark:border-orange-700",
    text: "text-orange-700 dark:text-orange-400",
    badge: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
    dot: "bg-orange-400",
  },
  SEVERE: {
    label: "SEVERE",
    bg: "bg-red-50 dark:bg-red-900/20",
    border: "border-red-400 dark:border-red-600",
    text: "text-red-700 dark:text-red-400",
    badge: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
    dot: "bg-red-500 animate-pulse",
  },
  LIFE_THREATENING: {
    label: "⚠ LIFE THREATENING",
    bg: "bg-red-100 dark:bg-red-950/40",
    border: "border-red-600 dark:border-red-500",
    text: "text-red-900 dark:text-red-300",
    badge: "bg-red-600 text-white dark:bg-red-700",
    dot: "bg-red-600 animate-ping",
  },
};

export default function AllergySection({ patientId, initialAllergies, canWrite }: Props) {
  const [allergies, setAllergies] = useState<Allergy[]>(initialAllergies);
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const [form, setForm] = useState({
    allergen: "",
    severity: "MILD" as "MILD" | "MODERATE" | "SEVERE" | "LIFE_THREATENING",
    reaction: "",
    confirmedAt: "",
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.allergen.trim()) return toast.error("Allergen name is required");

    setSaving(true);
    try {
      const res = await fetch(`/api/patients/${patientId}/allergies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          allergen: form.allergen.trim(),
          severity: form.severity,
          reaction: form.reaction.trim() || null,
          confirmedAt: form.confirmedAt || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add allergy");
      }

      const newAllergy = await res.json();
      setAllergies((prev) => [newAllergy, ...prev]);
      setForm({ allergen: "", severity: "MILD", reaction: "", confirmedAt: "" });
      setShowForm(false);
      toast.success(`${form.allergen} allergy recorded`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const res = await fetch(`/api/patients/${patientId}/allergies/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete allergy");
      setAllergies((prev) => prev.filter((a) => a.id !== id));
      toast.success("Allergy removed");
    } catch {
      toast.error("Failed to remove allergy");
    } finally {
      setDeleting(null);
      setConfirmDelete(null);
    }
  };

  const severeAllergies = allergies.filter(
    (a) => a.severity === "SEVERE" || a.severity === "LIFE_THREATENING"
  );

  return (
    <div className="space-y-6">
      {/* Red Alert Banner for SEVERE allergies */}
      {severeAllergies.length > 0 && (
        <div className="flex items-start gap-4 p-5 rounded-2xl bg-red-50 dark:bg-red-900/20 border-2 border-red-400 dark:border-red-600 shadow-sm shadow-red-100 dark:shadow-red-900/20">
          <ShieldAlert className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" size={22} />
          <div>
            <p className="text-sm font-black text-red-700 dark:text-red-400 uppercase tracking-widest">
              ⚠ SEVERE ALLERGY ALERT
            </p>
            <p className="text-sm text-red-600 dark:text-red-300 mt-1 font-medium">
              {severeAllergies.map((a) => a.allergen).join(", ")}
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle size={18} className="text-orange-500" />
          <span className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest">
            Known Allergies ({allergies.length})
          </span>
        </div>
        {canWrite && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 px-4 py-2 bg-[#1E3A5F] hover:bg-[#162d4a] text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all"
          >
            {showForm ? <X size={14} /> : <Plus size={14} />}
            {showForm ? "Cancel" : "Add Allergy"}
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
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest">
                Allergen *
              </label>
              <input
                type="text"
                value={form.allergen}
                onChange={(e) => setForm((f) => ({ ...f, allergen: e.target.value }))}
                placeholder="e.g. Penicillin, Peanuts, Latex"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm font-medium outline-none focus:border-[#1E3A5F] dark:focus:border-blue-500 transition-colors"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest">
                Severity *
              </label>
              <select
                value={form.severity}
                onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value as "MILD" | "MODERATE" | "SEVERE" | "LIFE_THREATENING" }))}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm font-medium outline-none focus:border-[#1E3A5F] dark:focus:border-blue-500 transition-colors"
              >
                <option value="MILD">Mild</option>
                <option value="MODERATE">Moderate</option>
                <option value="SEVERE">Severe</option>
                <option value="LIFE_THREATENING">Life Threatening</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest">
                Reaction / Symptoms
              </label>
              <input
                type="text"
                value={form.reaction}
                onChange={(e) => setForm((f) => ({ ...f, reaction: e.target.value }))}
                placeholder="e.g. Hives, Anaphylaxis, Rash"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm font-medium outline-none focus:border-[#1E3A5F] dark:focus:border-blue-500 transition-colors"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest">
                Confirmed Date
              </label>
              <input
                type="date"
                value={form.confirmedAt}
                onChange={(e) => setForm((f) => ({ ...f, confirmedAt: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm font-medium outline-none focus:border-[#1E3A5F] dark:focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-[#1E3A5F] hover:bg-[#162d4a] text-white text-sm font-black rounded-xl transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            Record Allergy
          </button>
        </form>
      )}

      {/* Allergy List */}
      {allergies.length === 0 ? (
        <div className="text-center py-10 text-slate-400 dark:text-slate-500">
          <AlertTriangle size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No allergies recorded</p>
        </div>
      ) : (
        <div className="space-y-3">
          {allergies.map((allergy) => {
            const cfg = SEVERITY_CONFIG[allergy.severity];
            return (
              <div
                key={allergy.id}
                className={`flex items-start justify-between gap-4 p-4 rounded-2xl border ${cfg.bg} ${cfg.border} transition-all`}
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${cfg.dot}`} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-black ${cfg.text}`}>{allergy.allergen}</span>
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${cfg.badge}`}>
                        {cfg.label}
                      </span>
                    </div>
                    {allergy.reaction && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                        Reaction: {allergy.reaction}
                      </p>
                    )}
                    {allergy.confirmedAt && (
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                        Confirmed: {new Date(allergy.confirmedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                {canWrite && (
                  <div className="shrink-0">
                    {confirmDelete === allergy.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-red-600 dark:text-red-400 font-bold">Remove?</span>
                        <button
                          onClick={() => handleDelete(allergy.id)}
                          disabled={deleting === allergy.id}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-lg transition-all disabled:opacity-50"
                        >
                          {deleting === allergy.id ? <Loader2 size={12} className="animate-spin" /> : "Yes"}
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="px-3 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-black rounded-lg transition-all"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(allergy.id)}
                        className="p-2 text-slate-400 hover:text-red-500 dark:hover:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
