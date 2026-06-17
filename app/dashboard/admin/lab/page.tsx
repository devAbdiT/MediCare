"use client";

import React, { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Plus,
  Edit2,
  Loader2,
  ToggleLeft,
  ToggleRight,
  Search,
  FlaskConical,
  X,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const LAB_CATEGORIES = [
  "Hematology",
  "Biochemistry",
  "Microbiology",
  "Immunology",
  "Urinalysis",
  "Radiology",
  "Pathology",
  "Other",
];

interface LabTest {
  id: string;
  name: string;
  code: string;
  category: string;
  referenceRange: string | null;
  unit: string | null;
  turnaroundHrs: number | null;
  price: number | string | null;
  isActive: boolean;
}

const emptyForm = {
  name: "",
  code: "",
  category: "Hematology",
  referenceRange: "",
  unit: "",
  turnaroundHrs: "",
  price: "",
};

export default function AdminLabCataloguePage() {
  const [tests, setTests] = useState<LabTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<LabTest | null>(null);
  const [formData, setFormData] = useState<typeof emptyForm>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchTests = useCallback(async () => {
    setLoading(true);
    try {
      const url = searchQuery.trim()
        ? `/api/lab/catalogue?q=${encodeURIComponent(searchQuery.trim())}`
        : "/api/lab/catalogue";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setTests(data);
      } else {
        toast.error("Failed to load lab test catalogue");
      }
    } catch {
      toast.error("Failed to connect to the server");
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchTests();
    }, 300);
    return () => clearTimeout(delay);
  }, [fetchTests]);

  const openAdd = () => {
    setEditingTest(null);
    setFormData(emptyForm);
    setIsDialogOpen(true);
  };

  const openEdit = (test: LabTest) => {
    setEditingTest(test);
    setFormData({
      name: test.name,
      code: test.code,
      category: test.category,
      referenceRange: test.referenceRange ?? "",
      unit: test.unit ?? "",
      turnaroundHrs: test.turnaroundHrs?.toString() ?? "",
      price: test.price?.toString() ?? "",
    });
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const url = editingTest
        ? `/api/lab/catalogue/${editingTest.id}`
        : "/api/lab/catalogue";
      const method = editingTest ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          code: formData.code.trim().toUpperCase(),
          category: formData.category,
          referenceRange: formData.referenceRange || null,
          unit: formData.unit || null,
          turnaroundHrs: formData.turnaroundHrs
            ? parseInt(formData.turnaroundHrs)
            : null,
          price: formData.price ? parseFloat(formData.price) : null,
        }),
      });

      if (res.ok) {
        toast.success(
          editingTest
            ? "Lab test updated successfully"
            : "Lab test added successfully"
        );
        setIsDialogOpen(false);
        fetchTests();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to save lab test");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (test: LabTest) => {
    setTogglingId(test.id);
    try {
      const res = await fetch(`/api/lab/catalogue/${test.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !test.isActive }),
      });
      if (res.ok) {
        toast.success(
          `Test marked as ${!test.isActive ? "Active" : "Inactive"}`
        );
        fetchTests();
      } else {
        toast.error("Failed to toggle status");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setTogglingId(null);
    }
  };

  const categoryColor: Record<string, string> = {
    Hematology:
      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    Biochemistry:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    Microbiology:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    Immunology:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    Urinalysis:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    Radiology:
      "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
    Pathology:
      "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
    Other:
      "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8">
        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#1E4A8A]/10 dark:bg-[#4A8AC8]/10 flex items-center justify-center">
              <FlaskConical
                size={24}
                className="text-[#1E4A8A] dark:text-[#4A8AC8]"
              />
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#1A2A4A] dark:text-[#E8EEF8] tracking-tight">
                Lab Test Catalogue
              </h1>
              <p className="text-sm text-[#5A6E8A] dark:text-[#8A9CBA] mt-0.5">
                Manage standardized tests, codes, prices, and reference ranges
              </p>
            </div>
          </div>

          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-5 py-3 bg-[#1E4A8A] hover:bg-[#163A6A] text-white rounded-2xl font-bold text-sm transition-all duration-300 shadow-lg shadow-[#1E4A8A]/20 active:scale-95"
          >
            <Plus size={18} />
            Add Test
          </button>
        </div>

        {/* ── Summary Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {
              label: "Total Tests",
              value: tests.length,
              color: "text-[#1E4A8A] dark:text-[#4A8AC8]",
              bg: "bg-[#1E4A8A]/5 dark:bg-[#4A8AC8]/5",
            },
            {
              label: "Active",
              value: tests.filter((t) => t.isActive).length,
              color: "text-emerald-600 dark:text-emerald-400",
              bg: "bg-emerald-50 dark:bg-emerald-900/20",
            },
            {
              label: "Inactive",
              value: tests.filter((t) => !t.isActive).length,
              color: "text-red-600 dark:text-red-400",
              bg: "bg-red-50 dark:bg-red-900/20",
            },
            {
              label: "Categories",
              value: new Set(tests.map((t) => t.category)).size,
              color: "text-purple-600 dark:text-purple-400",
              bg: "bg-purple-50 dark:bg-purple-900/20",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`${stat.bg} rounded-2xl p-4 border border-[#D0DCE8]/50 dark:border-[#1A2A4A]/50`}
            >
              <p className="text-xs font-bold text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-widest">
                {stat.label}
              </p>
              <p className={`text-3xl font-black mt-1 ${stat.color}`}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* ── Search Bar ── */}
        <div className="relative">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5A6E8A] dark:text-[#8A9CBA]"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by test name or code..."
            className="w-full pl-11 pr-10 py-3.5 bg-[#F0F4F8] dark:bg-[#0A122A] border border-[#D0DCE8] dark:border-[#1A2A4A] rounded-2xl text-sm font-medium text-[#1A2A4A] dark:text-[#E8EEF8] placeholder:text-[#5A6E8A] dark:placeholder:text-[#8A9CBA] outline-none focus:ring-2 focus:ring-[#1E4A8A]/30 dark:focus:ring-[#4A8AC8]/30 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5A6E8A] hover:text-[#1A2A4A] dark:hover:text-[#E8EEF8]"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* ── Table ── */}
        <div className="bg-[#F0F4F8] dark:bg-[#0A122A] rounded-2xl border border-[#D0DCE8] dark:border-[#1A2A4A] overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2
                size={32}
                className="animate-spin text-[#1E4A8A] dark:text-[#4A8AC8]"
              />
              <p className="text-sm font-medium text-[#5A6E8A] dark:text-[#8A9CBA]">
                Loading catalogue...
              </p>
            </div>
          ) : tests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <FlaskConical
                size={40}
                className="text-[#D0DCE8] dark:text-[#1A2A4A]"
              />
              <p className="text-sm font-bold text-[#5A6E8A] dark:text-[#8A9CBA]">
                {searchQuery
                  ? "No tests match your search"
                  : "No lab tests added yet"}
              </p>
              {!searchQuery && (
                <button
                  onClick={openAdd}
                  className="mt-2 text-xs font-bold text-[#1E4A8A] dark:text-[#4A8AC8] hover:underline"
                >
                  + Add your first test
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#D0DCE8] dark:border-[#1A2A4A] hover:bg-transparent">
                    {[
                      "Code",
                      "Test Name",
                      "Category",
                      "Ref Range",
                      "Unit",
                      "Turnaround (hrs)",
                      "Price (ETB)",
                      "Status",
                      "Actions",
                    ].map((h) => (
                      <TableHead
                        key={h}
                        className="text-[10px] font-black uppercase tracking-widest text-[#5A6E8A] dark:text-[#8A9CBA] py-4 first:pl-6 last:pr-6"
                      >
                        {h}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tests.map((test) => (
                    <TableRow
                      key={test.id}
                      className="border-[#D0DCE8]/50 dark:border-[#1A2A4A]/50 hover:bg-white/60 dark:hover:bg-[#111C3A]/40 transition-colors"
                    >
                      <TableCell className="pl-6 font-black text-xs text-[#1E4A8A] dark:text-[#4A8AC8] font-mono tracking-wider">
                        {test.code}
                      </TableCell>
                      <TableCell className="font-bold text-sm text-[#1A2A4A] dark:text-[#E8EEF8] max-w-[180px] truncate">
                        {test.name}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                            categoryColor[test.category] ?? categoryColor.Other
                          }`}
                        >
                          {test.category}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-[#5A6E8A] dark:text-[#8A9CBA] max-w-[120px] truncate">
                        {test.referenceRange ?? (
                          <span className="text-[#D0DCE8] dark:text-[#1A2A4A]">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-[#5A6E8A] dark:text-[#8A9CBA]">
                        {test.unit ?? (
                          <span className="text-[#D0DCE8] dark:text-[#1A2A4A]">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm font-bold text-[#1A2A4A] dark:text-[#E8EEF8]">
                        {test.turnaroundHrs ?? (
                          <span className="text-[#D0DCE8] dark:text-[#1A2A4A] font-normal">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm font-bold text-[#1A2A4A] dark:text-[#E8EEF8]">
                        {test.price != null ? (
                          <span>
                            ETB{" "}
                            {Number(test.price).toLocaleString("en-ET", {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        ) : (
                          <span className="text-[#D0DCE8] dark:text-[#1A2A4A] font-normal">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {test.isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-[10px] font-black uppercase tracking-wider">
                            <CheckCircle2 size={11} />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] font-black uppercase tracking-wider">
                            <XCircle size={11} />
                            Inactive
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="pr-6">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEdit(test)}
                            title="Edit"
                            className="w-8 h-8 rounded-xl bg-[#1E4A8A]/10 hover:bg-[#1E4A8A] text-[#1E4A8A] hover:text-white flex items-center justify-center transition-all duration-200 active:scale-90"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleToggle(test)}
                            title={
                              test.isActive
                                ? "Deactivate test"
                                : "Activate test"
                            }
                            disabled={togglingId === test.id}
                            className="w-8 h-8 rounded-xl bg-[#5A6E8A]/10 hover:bg-[#5A6E8A]/20 text-[#5A6E8A] dark:text-[#8A9CBA] flex items-center justify-center transition-all duration-200 active:scale-90 disabled:opacity-50"
                          >
                            {togglingId === test.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : test.isActive ? (
                              <ToggleRight size={16} className="text-emerald-500" />
                            ) : (
                              <ToggleLeft size={16} className="text-red-400" />
                            )}
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {/* ── Add / Edit Dialog ── */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg bg-white dark:bg-[#111C3A] border-[#D0DCE8] dark:border-[#1A2A4A] rounded-3xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-[#1A2A4A] dark:text-[#E8EEF8] flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#1E4A8A]/10 dark:bg-[#4A8AC8]/10 flex items-center justify-center">
                <FlaskConical
                  size={18}
                  className="text-[#1E4A8A] dark:text-[#4A8AC8]"
                />
              </div>
              {editingTest ? "Edit Lab Test" : "Add Lab Test"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-5 mt-2">
            <div className="grid grid-cols-2 gap-4">
              {/* Name */}
              <div className="col-span-2">
                <label className="block text-xs font-black text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-wider mb-1.5">
                  Test Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g. Complete Blood Count"
                  className="w-full px-4 py-3 rounded-xl bg-[#F0F4F8] dark:bg-[#0A122A] border border-[#D0DCE8] dark:border-[#1A2A4A] text-sm font-medium text-[#1A2A4A] dark:text-[#E8EEF8] placeholder:text-[#5A6E8A]/60 outline-none focus:ring-2 focus:ring-[#1E4A8A]/30 transition-all"
                />
              </div>

              {/* Code */}
              <div>
                <label className="block text-xs font-black text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-wider mb-1.5">
                  Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="CBC001"
                  className="w-full px-4 py-3 rounded-xl bg-[#F0F4F8] dark:bg-[#0A122A] border border-[#D0DCE8] dark:border-[#1A2A4A] text-sm font-mono font-bold text-[#1E4A8A] dark:text-[#4A8AC8] placeholder:text-[#5A6E8A]/60 outline-none focus:ring-2 focus:ring-[#1E4A8A]/30 transition-all uppercase tracking-widest"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-black text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-wider mb-1.5">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl bg-[#F0F4F8] dark:bg-[#0A122A] border border-[#D0DCE8] dark:border-[#1A2A4A] text-sm font-medium text-[#1A2A4A] dark:text-[#E8EEF8] outline-none focus:ring-2 focus:ring-[#1E4A8A]/30 transition-all cursor-pointer"
                >
                  {LAB_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reference Range */}
              <div>
                <label className="block text-xs font-black text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-wider mb-1.5">
                  Reference Range
                </label>
                <input
                  type="text"
                  value={formData.referenceRange}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      referenceRange: e.target.value,
                    })
                  }
                  placeholder="4.5–11.0"
                  className="w-full px-4 py-3 rounded-xl bg-[#F0F4F8] dark:bg-[#0A122A] border border-[#D0DCE8] dark:border-[#1A2A4A] text-sm font-medium text-[#1A2A4A] dark:text-[#E8EEF8] placeholder:text-[#5A6E8A]/60 outline-none focus:ring-2 focus:ring-[#1E4A8A]/30 transition-all"
                />
              </div>

              {/* Unit */}
              <div>
                <label className="block text-xs font-black text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-wider mb-1.5">
                  Unit
                </label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) =>
                    setFormData({ ...formData, unit: e.target.value })
                  }
                  placeholder="×10³/µL"
                  className="w-full px-4 py-3 rounded-xl bg-[#F0F4F8] dark:bg-[#0A122A] border border-[#D0DCE8] dark:border-[#1A2A4A] text-sm font-medium text-[#1A2A4A] dark:text-[#E8EEF8] placeholder:text-[#5A6E8A]/60 outline-none focus:ring-2 focus:ring-[#1E4A8A]/30 transition-all"
                />
              </div>

              {/* Turnaround */}
              <div>
                <label className="block text-xs font-black text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-wider mb-1.5">
                  Turnaround (hrs)
                </label>
                <input
                  type="number"
                  min={1}
                  value={formData.turnaroundHrs}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      turnaroundHrs: e.target.value,
                    })
                  }
                  placeholder="24"
                  className="w-full px-4 py-3 rounded-xl bg-[#F0F4F8] dark:bg-[#0A122A] border border-[#D0DCE8] dark:border-[#1A2A4A] text-sm font-medium text-[#1A2A4A] dark:text-[#E8EEF8] placeholder:text-[#5A6E8A]/60 outline-none focus:ring-2 focus:ring-[#1E4A8A]/30 transition-all"
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-xs font-black text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-wider mb-1.5">
                  Price (ETB)
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  placeholder="80.00"
                  className="w-full px-4 py-3 rounded-xl bg-[#F0F4F8] dark:bg-[#0A122A] border border-[#D0DCE8] dark:border-[#1A2A4A] text-sm font-medium text-[#1A2A4A] dark:text-[#E8EEF8] placeholder:text-[#5A6E8A]/60 outline-none focus:ring-2 focus:ring-[#1E4A8A]/30 transition-all"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDialogOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-[#D0DCE8] dark:border-[#1A2A4A] text-sm font-bold text-[#5A6E8A] dark:text-[#8A9CBA] hover:bg-[#F0F4F8] dark:hover:bg-[#0A122A] transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#1E4A8A] hover:bg-[#163A6A] disabled:opacity-60 text-white rounded-xl text-sm font-bold transition-all duration-300 active:scale-95 shadow-lg shadow-[#1E4A8A]/20"
              >
                {isSubmitting && (
                  <Loader2 size={14} className="animate-spin" />
                )}
                {editingTest ? "Save Changes" : "Add Test"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
