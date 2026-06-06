// app/dashboard/admin/doctors/DoctorFeeTable.tsx
"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import {
  Stethoscope, Building2, DollarSign, Check, X, Pencil,
  User, Phone, Mail, Calendar
} from "lucide-react";
import { format } from "date-fns";

interface Doctor {
  id: string;
  specialization: string;
  consultationFee: number | null;
  bio: string | null;
  profilePhoto: string | null;
  department: { id: string; name: string; consultationFee: number } | null;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    createdAt: string;
    role: string;
  };
}

export default function DoctorFeeTable({ doctors: initialDoctors }: { doctors: Doctor[] }) {
  const [doctors, setDoctors] = useState(initialDoctors);
  const [editingFee, setEditingFee] = useState<string | null>(null);
  const [feeInput, setFeeInput] = useState("");
  const [savingFee, setSavingFee] = useState<string | null>(null);

  const startEdit = (doctor: Doctor) => {
    setEditingFee(doctor.id);
    setFeeInput(doctor.consultationFee?.toString() || "");
  };

  const cancelEdit = () => {
    setEditingFee(null);
    setFeeInput("");
  };

  const saveFee = async (doctorId: string) => {
    const fee = parseFloat(feeInput);
    if (isNaN(fee) || fee < 0) {
      toast.error("Please enter a valid fee amount");
      return;
    }

    setSavingFee(doctorId);
    try {
      const res = await fetch(`/api/doctors/${doctorId}/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consultationFee: fee }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update fee");
      }

      const updated = await res.json();
      setDoctors((prev) =>
        prev.map((d) =>
          d.id === doctorId
            ? { ...d, consultationFee: Number(updated.consultationFee) }
            : d
        )
      );
      toast.success(`Fee updated to ETB ${fee.toFixed(2)}`);
      setEditingFee(null);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingFee(null);
    }
  };

  const handleFeeKeyDown = (e: React.KeyboardEvent, doctorId: string) => {
    if (e.key === "Enter") saveFee(doctorId);
    if (e.key === "Escape") cancelEdit();
  };

  if (doctors.length === 0) {
    return (
      <div className="bg-white dark:bg-[#111C3A] rounded-[2.5rem] border border-[#D0DCE8] dark:border-[#1A2A4A] p-16 text-center">
        <Stethoscope size={48} className="mx-auto text-[#D0DCE8] dark:text-[#1A2A4A] mb-4" />
        <p className="text-[#5A6E8A] dark:text-[#8A9CBA] font-bold">No doctors registered yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#111C3A] rounded-[2.5rem] border border-[#D0DCE8] dark:border-[#1A2A4A] overflow-hidden shadow-sm">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#D0DCE8] dark:border-[#1A2A4A] bg-[#F0F4F8] dark:bg-[#0A122A]">
              <th className="text-left px-6 py-4 text-[10px] font-black text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-[0.15em]">
                Doctor
              </th>
              <th className="text-left px-6 py-4 text-[10px] font-black text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-[0.15em]">
                Specialization
              </th>
              <th className="text-left px-6 py-4 text-[10px] font-black text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-[0.15em]">
                Department
              </th>
              <th className="text-left px-6 py-4 text-[10px] font-black text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-[0.15em]">
                Dept. Default Fee
              </th>
              <th className="text-left px-6 py-4 text-[10px] font-black text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-[0.15em]">
                Consultation Fee (ETB)
              </th>
              <th className="text-left px-6 py-4 text-[10px] font-black text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-[0.15em]">
                Joined
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0F4F8] dark:divide-[#1A2A4A]">
            {doctors.map((doctor) => (
              <tr
                key={doctor.id}
                className="group hover:bg-[#F0F4F8]/50 dark:hover:bg-[#0A122A]/50 transition-colors"
              >
                {/* Doctor identity */}
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl overflow-hidden bg-[#F0F4F8] dark:bg-[#0A122A] flex items-center justify-center shrink-0 border border-[#D0DCE8] dark:border-[#1A2A4A]">
                      {doctor.profilePhoto ? (
                        <img
                          src={doctor.profilePhoto}
                          alt={doctor.user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User size={20} className="text-[#1E4A8A] dark:text-[#4A8AC8]" />
                      )}
                    </div>
                    <div>
                      <p className="font-black text-sm text-[#1A2A4A] dark:text-[#E8EEF8]">
                        {doctor.user.name}
                      </p>
                      <p className="text-xs text-[#5A6E8A] dark:text-[#8A9CBA] flex items-center gap-1">
                        <Mail size={10} />
                        {doctor.user.email}
                      </p>
                      {doctor.user.phone && (
                        <p className="text-xs text-[#5A6E8A] dark:text-[#8A9CBA] flex items-center gap-1">
                          <Phone size={10} />
                          {doctor.user.phone}
                        </p>
                      )}
                    </div>
                  </div>
                </td>

                {/* Specialization */}
                <td className="px-6 py-5">
                  <div className="flex items-center gap-2">
                    <Stethoscope size={14} className="text-[#1E4A8A] dark:text-[#4A8AC8] shrink-0" />
                    <span className="text-sm font-bold text-[#1A2A4A] dark:text-[#E8EEF8]">
                      {doctor.specialization}
                    </span>
                  </div>
                </td>

                {/* Department */}
                <td className="px-6 py-5">
                  {doctor.department ? (
                    <div className="flex items-center gap-2">
                      <Building2 size={14} className="text-[#5A6E8A] dark:text-[#8A9CBA] shrink-0" />
                      <span className="text-sm font-bold text-[#1A2A4A] dark:text-[#E8EEF8]">
                        {doctor.department.name}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-[#5A6E8A] dark:text-[#8A9CBA] italic">Unassigned</span>
                  )}
                </td>

                {/* Dept default fee */}
                <td className="px-6 py-5">
                  <span className="text-sm text-[#5A6E8A] dark:text-[#8A9CBA] font-bold">
                    {doctor.department?.consultationFee != null
                      ? `ETB ${Number(doctor.department.consultationFee).toFixed(2)}`
                      : "—"}
                  </span>
                </td>

                {/* Doctor's own fee — inline edit */}
                <td className="px-6 py-5">
                  {editingFee === doctor.id ? (
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-[#5A6E8A]">
                          ETB
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={feeInput}
                          onChange={(e) => setFeeInput(e.target.value)}
                          onKeyDown={(e) => handleFeeKeyDown(e, doctor.id)}
                          autoFocus
                          className="w-28 pl-10 pr-3 py-2 bg-[#F0F4F8] dark:bg-[#0A122A] border border-[#1E4A8A] dark:border-[#4A8AC8] rounded-xl text-sm font-black text-[#1A2A4A] dark:text-[#E8EEF8] outline-none"
                        />
                      </div>
                      <button
                        onClick={() => saveFee(doctor.id)}
                        disabled={savingFee === doctor.id}
                        className="w-8 h-8 bg-green-500 hover:bg-green-600 text-white rounded-xl flex items-center justify-center transition-colors disabled:opacity-50"
                        title="Save (Enter)"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="w-8 h-8 bg-[#F0F4F8] dark:bg-[#0A122A] text-[#5A6E8A] hover:text-red-500 rounded-xl flex items-center justify-center transition-colors"
                        title="Cancel (Esc)"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <DollarSign size={14} className="text-[#1E4A8A] dark:text-[#4A8AC8]" />
                        <span className={`text-sm font-black ${
                          doctor.consultationFee != null
                            ? "text-[#1A2A4A] dark:text-[#E8EEF8]"
                            : "text-[#5A6E8A] dark:text-[#8A9CBA] italic"
                        }`}>
                          {doctor.consultationFee != null
                            ? `ETB ${doctor.consultationFee.toFixed(2)}`
                            : "Not set"}
                        </span>
                      </div>
                      <button
                        onClick={() => startEdit(doctor)}
                        className="opacity-0 group-hover:opacity-100 w-7 h-7 bg-[#1E4A8A]/10 hover:bg-[#1E4A8A] text-[#1E4A8A] hover:text-white rounded-lg flex items-center justify-center transition-all"
                        title="Edit fee"
                      >
                        <Pencil size={12} />
                      </button>
                    </div>
                  )}
                </td>

                {/* Joined */}
                <td className="px-6 py-5">
                  <div className="flex items-center gap-1.5 text-xs text-[#5A6E8A] dark:text-[#8A9CBA] font-bold">
                    <Calendar size={12} />
                    {format(new Date(doctor.user.createdAt), "MMM dd, yyyy")}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer summary */}
      <div className="px-6 py-4 border-t border-[#D0DCE8] dark:border-[#1A2A4A] bg-[#F0F4F8] dark:bg-[#0A122A] flex flex-wrap gap-6">
        <div>
          <p className="text-[10px] font-black text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-widest">
            Total Doctors
          </p>
          <p className="text-xl font-black text-[#1E4A8A] dark:text-[#4A8AC8]">{doctors.length}</p>
        </div>
        <div>
          <p className="text-[10px] font-black text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-widest">
            With Fee Set
          </p>
          <p className="text-xl font-black text-[#1E4A8A] dark:text-[#4A8AC8]">
            {doctors.filter((d) => d.consultationFee != null).length}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-black text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-widest">
            Avg. Fee
          </p>
          <p className="text-xl font-black text-[#1E4A8A] dark:text-[#4A8AC8]">
            {(() => {
              const withFee = doctors.filter((d) => d.consultationFee != null);
              if (withFee.length === 0) return "—";
              const avg = withFee.reduce((s, d) => s + (d.consultationFee ?? 0), 0) / withFee.length;
              return `ETB ${avg.toFixed(0)}`;
            })()}
          </p>
        </div>
      </div>
    </div>
  );
}
