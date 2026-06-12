// components/doctor/PrescriptionBuilder.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Printer, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface PrescriptionItem {
  id?: string;
  drugName: string;
  dose: string;
  frequency: string;
  duration: string;
  route: string;
  quantity: string;
  instructions: string;
}

interface PrescriptionBuilderProps {
  medicalRecordId?: string;
  onChange?: (items: PrescriptionItem[]) => void;
  readOnly?: boolean;
}

const FREQUENCY_OPTIONS = [
  "Once daily",
  "Twice daily",
  "Three times daily",
  "Every 8 hours",
  "At bedtime",
  "As needed"
];

const ROUTE_OPTIONS = [
  "Oral",
  "IV",
  "IM",
  "Topical",
  "Sublingual",
  "Inhalation",
  "Rectal"
];

export default function PrescriptionBuilder({
  medicalRecordId,
  onChange,
  readOnly = false
}: PrescriptionBuilderProps) {
  const [items, setItems] = useState<PrescriptionItem[]>([
    { drugName: "", dose: "", frequency: "Once daily", duration: "", route: "Oral", quantity: "", instructions: "" }
  ]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (medicalRecordId) {
      const fetchItems = async () => {
        try {
          setLoading(true);
          const res = await fetch(`/api/prescriptions?recordId=${medicalRecordId}`);
          if (res.ok) {
            const data = await res.json();
            if (data && data.length > 0) {
              setItems(data.map((item: any) => ({
                id: item.id,
                drugName: item.drugName,
                dose: item.dose,
                frequency: item.frequency,
                duration: item.duration,
                route: item.route,
                quantity: item.quantity ? String(item.quantity) : "",
                instructions: item.instructions || ""
              })));
              setSaved(true);
            }
          }
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchItems();
    }
  }, [medicalRecordId]);

  // Propagate changes to parent form
  const handleItemsChange = (newItems: PrescriptionItem[]) => {
    setItems(newItems);
    setSaved(false);
    if (onChange) {
      onChange(newItems);
    }
  };

  const addRow = () => {
    const newItems = [
      ...items,
      { drugName: "", dose: "", frequency: "Once daily", duration: "", route: "Oral", quantity: "", instructions: "" }
    ];
    handleItemsChange(newItems);
  };

  const removeRow = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    handleItemsChange(newItems.length === 0 ? [{ drugName: "", dose: "", frequency: "Once daily", duration: "", route: "Oral", quantity: "", instructions: "" }] : newItems);
  };

  const updateField = (index: number, field: keyof PrescriptionItem, value: string) => {
    const newItems = items.map((item, i) => {
      if (i === index) {
        return { ...item, [field]: value };
      }
      return item;
    });
    handleItemsChange(newItems);
  };

  const handleSave = async () => {
    if (!medicalRecordId) {
      toast.error("Complete the appointment first to generate a medical record.");
      return;
    }

    // Validate inputs
    const invalidItem = items.some(item => !item.drugName || !item.dose || !item.duration);
    if (invalidItem) {
      toast.error("Please fill in Drug Name, Dose, and Duration for all items.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/prescriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medicalRecordId,
          items
        })
      });

      if (res.ok) {
        toast.success("Prescription items saved successfully!");
        setSaved(true);
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Failed to save prescription items");
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-6">
        <Loader2 className="animate-spin text-[#1E4A8A]" size={24} />
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-slate-50 dark:bg-[#0A122A] p-6 rounded-3xl border border-[#D0DCE8] dark:border-[#1A2A4A]">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b border-[#D0DCE8] dark:border-[#1A2A4A]">
              <th className="pb-3 text-xs font-black text-[#5A6E8A] uppercase tracking-wider">Drug Name</th>
              <th className="pb-3 text-xs font-black text-[#5A6E8A] uppercase tracking-wider">Dose</th>
              <th className="pb-3 text-xs font-black text-[#5A6E8A] uppercase tracking-wider">Frequency</th>
              <th className="pb-3 text-xs font-black text-[#5A6E8A] uppercase tracking-wider">Duration</th>
              <th className="pb-3 text-xs font-black text-[#5A6E8A] uppercase tracking-wider">Route</th>
              <th className="pb-3 text-xs font-black text-[#5A6E8A] uppercase tracking-wider w-16">Qty</th>
              <th className="pb-3 text-xs font-black text-[#5A6E8A] uppercase tracking-wider">Instructions</th>
              {!readOnly && <th className="pb-3 text-xs font-black text-[#5A6E8A] uppercase tracking-wider w-10 text-center"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/50 dark:divide-[#1A2A4A]/50">
            {items.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-100/30 dark:hover:bg-slate-900/10">
                <td className="py-3 pr-2">
                  <input
                    type="text"
                    disabled={readOnly}
                    value={item.drugName}
                    onChange={(e) => updateField(idx, "drugName", e.target.value)}
                    placeholder="e.g. Amoxicillin"
                    className="w-full p-2.5 bg-white dark:bg-[#111C3A] border border-[#D0DCE8] dark:border-[#1A2A4A] rounded-xl text-xs font-bold text-[#1A2A4A] dark:text-white outline-none focus:border-[#1E4A8A] disabled:opacity-60"
                    required
                  />
                </td>
                <td className="py-3 pr-2 w-28">
                  <input
                    type="text"
                    disabled={readOnly}
                    value={item.dose}
                    onChange={(e) => updateField(idx, "dose", e.target.value)}
                    placeholder="e.g. 500 mg"
                    className="w-full p-2.5 bg-white dark:bg-[#111C3A] border border-[#D0DCE8] dark:border-[#1A2A4A] rounded-xl text-xs font-bold text-[#1A2A4A] dark:text-white outline-none focus:border-[#1E4A8A] disabled:opacity-60"
                    required
                  />
                </td>
                <td className="py-3 pr-2 w-40">
                  <select
                    disabled={readOnly}
                    value={item.frequency}
                    onChange={(e) => updateField(idx, "frequency", e.target.value)}
                    className="w-full p-2.5 bg-white dark:bg-[#111C3A] border border-[#D0DCE8] dark:border-[#1A2A4A] rounded-xl text-xs font-bold text-[#1A2A4A] dark:text-white outline-none focus:border-[#1E4A8A] disabled:opacity-60"
                  >
                    {FREQUENCY_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </td>
                <td className="py-3 pr-2 w-28">
                  <input
                    type="text"
                    disabled={readOnly}
                    value={item.duration}
                    onChange={(e) => updateField(idx, "duration", e.target.value)}
                    placeholder="e.g. 7 days"
                    className="w-full p-2.5 bg-white dark:bg-[#111C3A] border border-[#D0DCE8] dark:border-[#1A2A4A] rounded-xl text-xs font-bold text-[#1A2A4A] dark:text-white outline-none focus:border-[#1E4A8A] disabled:opacity-60"
                    required
                  />
                </td>
                <td className="py-3 pr-2 w-28">
                  <select
                    disabled={readOnly}
                    value={item.route}
                    onChange={(e) => updateField(idx, "route", e.target.value)}
                    className="w-full p-2.5 bg-white dark:bg-[#111C3A] border border-[#D0DCE8] dark:border-[#1A2A4A] rounded-xl text-xs font-bold text-[#1A2A4A] dark:text-white outline-none focus:border-[#1E4A8A] disabled:opacity-60"
                  >
                    {ROUTE_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </td>
                <td className="py-3 pr-2 w-16">
                  <input
                    type="number"
                    disabled={readOnly}
                    value={item.quantity}
                    onChange={(e) => updateField(idx, "quantity", e.target.value)}
                    placeholder="Qty"
                    className="w-full p-2.5 bg-white dark:bg-[#111C3A] border border-[#D0DCE8] dark:border-[#1A2A4A] rounded-xl text-xs font-bold text-[#1A2A4A] dark:text-white outline-none focus:border-[#1E4A8A] disabled:opacity-60"
                  />
                </td>
                <td className="py-3 pr-2">
                  <input
                    type="text"
                    disabled={readOnly}
                    value={item.instructions}
                    onChange={(e) => updateField(idx, "instructions", e.target.value)}
                    placeholder="e.g. Take after meals"
                    className="w-full p-2.5 bg-white dark:bg-[#111C3A] border border-[#D0DCE8] dark:border-[#1A2A4A] rounded-xl text-xs font-bold text-[#1A2A4A] dark:text-white outline-none focus:border-[#1E4A8A] disabled:opacity-60"
                  />
                </td>
                {!readOnly && (
                  <td className="py-3 text-center">
                    <button
                      type="button"
                      onClick={() => removeRow(idx)}
                      className="p-2 text-[#D94A5A] hover:bg-[#D94A5A]/10 rounded-xl transition-colors"
                      title="Remove Drug"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!readOnly && (
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3">
          <button
            type="button"
            onClick={addRow}
            className="px-5 py-2.5 bg-white dark:bg-[#111C3A] border border-[#D0DCE8] dark:border-[#1A2A4A] hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-black text-[#1E4A8A] dark:text-[#4A8AC8] rounded-xl transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
          >
            <Plus size={14} />
            Add Drug
          </button>

          {medicalRecordId && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
              >
                {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                Save Prescription
              </button>

              {saved && (
                <a
                  href={`/api/print/prescription/${medicalRecordId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-2.5 bg-[#1E4A8A] hover:bg-[#0F3A6A] text-white text-xs font-black rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-1.5"
                >
                  <Printer size={14} />
                  Print Prescription
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
