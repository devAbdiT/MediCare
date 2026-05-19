"use client";

import React, { useState } from "react";
import { format, differenceInYears } from "date-fns";
import {
  X,
  User,
  Mail,
  Phone,
  Calendar,
  Droplets,
  Stethoscope,
  Building2,
  ClipboardList,
  Activity,
  Clock,
  Eye,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  CreditCard,
} from "lucide-react";
import { toast } from "sonner";

interface ViewUserModalProps {
  userId: string;
  userName: string;
  userRole: string;
}

const statusConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  SCHEDULED: { label: "Scheduled", icon: <Clock size={12} />, color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400" },
  COMPLETED: { label: "Completed", icon: <CheckCircle2 size={12} />, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400" },
  CANCELLED: { label: "Cancelled", icon: <XCircle size={12} />, color: "text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400" },
  RESCHEDULED: { label: "Rescheduled", icon: <AlertCircle size={12} />, color: "text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400" },
};

export function ViewUserModal({ userId, userName, userRole }: ViewUserModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  const handleOpen = async () => {
    setOpen(true);
    if (data) return; // Already fetched
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/details`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setData(json);
    } catch {
      toast.error("Failed to load user details");
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1E4A8A]/10 dark:bg-[#4A8AC8]/10 text-[#1E4A8A] dark:text-[#4A8AC8] hover:bg-[#1E4A8A] hover:text-white dark:hover:bg-[#4A8AC8] dark:hover:text-white text-[10px] font-black uppercase tracking-widest transition-all"
        title={`View ${userName}`}
      >
        <Eye size={13} />
        View
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />

          {/* Modal */}
          <div className="relative w-full max-w-2xl max-h-[90vh] bg-white dark:bg-[#111C3A] rounded-[2.5rem] border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-2xl overflow-hidden flex flex-col z-10">
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-[#F0F4F8] dark:border-[#1A2A4A] bg-gradient-to-r from-[#1E4A8A]/5 to-transparent dark:from-[#4A8AC8]/5 shrink-0">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg
                  ${userRole === "PATIENT" ? "bg-emerald-100 dark:bg-emerald-900/40 text-[#2D8A6E]" :
                    userRole === "DOCTOR" ? "bg-blue-100 dark:bg-blue-900/40 text-[#1E4A8A]" :
                    "bg-purple-100 dark:bg-purple-900/40 text-purple-700"}`}>
                  {userName[0]}
                </div>
                <div>
                  <h2 className="text-xl font-black text-[#1A2A4A] dark:text-[#E8EEF8] tracking-tight">{userName}</h2>
                  <span className={`text-[10px] font-black uppercase tracking-widest
                    ${userRole === "PATIENT" ? "text-[#2D8A6E]" :
                      userRole === "DOCTOR" ? "text-[#1E4A8A] dark:text-[#4A8AC8]" :
                      "text-purple-600"}`}>
                    {userRole === "RECEPTIONIST" ? "Front Desk Staff" : userRole}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-10 h-10 rounded-2xl bg-[#F0F4F8] dark:bg-[#0A122A] text-[#5A6E8A] hover:text-[#D94A5A] hover:bg-[#D94A5A]/10 flex items-center justify-center transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 p-8 space-y-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 className="animate-spin text-[#1E4A8A]" size={40} />
                  <p className="text-sm font-black uppercase tracking-widest text-[#5A6E8A]">Loading profile data...</p>
                </div>
              ) : data ? (
                <>
                  {/* Personal Info */}
                  <Section title="Personal Information" icon={<User size={16} />} color="blue">
                    <InfoGrid>
                      <InfoItem icon={<Mail size={14} />} label="Email" value={data.email} />
                      <InfoItem icon={<Phone size={14} />} label="Phone" value={data.phone || "Not provided"} />
                      <InfoItem icon={<Calendar size={14} />} label="Registered" value={format(new Date(data.createdAt), "MMM dd, yyyy")} />

                      {/* Patient-specific */}
                      {data.patient && (
                        <>
                          {data.patient.dateOfBirth && (
                            <InfoItem
                              icon={<Calendar size={14} />}
                              label="Date of Birth"
                              value={`${format(new Date(data.patient.dateOfBirth), "MMM dd, yyyy")} (${differenceInYears(new Date(), new Date(data.patient.dateOfBirth))} yrs)`}
                            />
                          )}
                          {data.patient.bloodType && (
                            <InfoItem icon={<Droplets size={14} />} label="Blood Type" value={data.patient.bloodType} highlight="emerald" />
                          )}
                          {data.patient.cardNumber && (
                            <InfoItem icon={<CreditCard size={14} />} label="Card No." value={data.patient.cardNumber} />
                          )}
                        </>
                      )}

                      {/* Doctor-specific */}
                      {data.doctor && (
                        <>
                          <InfoItem icon={<Stethoscope size={14} />} label="Specialization" value={data.doctor.specialization} highlight="blue" />
                          <InfoItem icon={<Building2 size={14} />} label="Department" value={data.doctor.department?.name || "Unassigned"} />
                        </>
                      )}
                    </InfoGrid>
                  </Section>

                  {/* Statistics for Doctor */}
                  {data.doctor && (
                    <Section title="Statistics" icon={<Activity size={16} />} color="blue">
                      <div className="grid grid-cols-2 gap-4">
                        <StatCard label="Total Appointments" value={data.doctor._count.appointments} color="blue" />
                        <StatCard label="Medical Records" value={data.doctor._count.medicalRecords} color="emerald" />
                        <StatCard
                          label="Upcoming"
                          value={data.doctor.appointments?.filter((a: any) => a.status === "SCHEDULED").length ?? 0}
                          color="amber"
                        />
                        <StatCard
                          label="Completed"
                          value={data.doctor.appointments?.filter((a: any) => a.status === "COMPLETED").length ?? 0}
                          color="purple"
                        />
                      </div>
                    </Section>
                  )}

                  {/* Patient Medical History */}
                  {data.patient?.medicalRecords?.length > 0 && (
                    <Section title="Medical History" icon={<ClipboardList size={16} />} color="emerald">
                      <div className="space-y-3">
                        {data.patient.medicalRecords.map((record: any) => (
                          <div key={record.id} className="p-4 bg-[#F0F4F8] dark:bg-[#0A122A] rounded-2xl">
                            <div className="flex justify-between items-start mb-1">
                              <p className="text-xs font-black text-[#2D8A6E] uppercase tracking-widest">{format(new Date(record.date), "MMM dd, yyyy")}</p>
                              <p className="text-[10px] text-[#5A6E8A] dark:text-[#8A9CBA] font-bold">Dr. {record.doctor?.user?.name}</p>
                            </div>
                            <p className="font-bold text-[#1A2A4A] dark:text-[#E8EEF8] text-sm">{record.diagnosis}</p>
                            <p className="text-xs text-[#5A6E8A] dark:text-[#8A9CBA] mt-1 line-clamp-2">{record.prescription}</p>
                          </div>
                        ))}
                      </div>
                    </Section>
                  )}

                  {/* Appointments */}
                  {(() => {
                    const appts = data.patient?.appointments || data.doctor?.appointments || data.receptionist?.appointments;
                    if (!appts?.length) return null;
                    return (
                      <Section title="Recent Appointments" icon={<Calendar size={16} />} color="purple">
                        <div className="space-y-3">
                          {appts.map((appt: any) => {
                            const cfg = statusConfig[appt.status] || statusConfig["SCHEDULED"];
                            const personName = data.patient
                              ? appt.doctor?.user?.name
                              : appt.patient?.user?.name;
                            return (
                              <div key={appt.id} className="flex items-center justify-between p-4 bg-[#F0F4F8] dark:bg-[#0A122A] rounded-2xl">
                                <div>
                                  <p className="font-bold text-[#1A2A4A] dark:text-[#E8EEF8] text-sm">
                                    {format(new Date(appt.dateTime), "MMM dd, yyyy · h:mm a")}
                                  </p>
                                  <p className="text-[10px] text-[#5A6E8A] dark:text-[#8A9CBA] font-bold mt-0.5">
                                    {personName ? `${data.patient ? "Dr." : "Patient"} ${personName}` : ""}
                                    {appt.reason && ` · ${appt.reason}`}
                                  </p>
                                </div>
                                <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${cfg.color}`}>
                                  {cfg.icon}
                                  {cfg.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </Section>
                    );
                  })()}

                  {/* Receptionist stats */}
                  {data.receptionist && (
                    <Section title="Statistics" icon={<Activity size={16} />} color="purple">
                      <div className="grid grid-cols-2 gap-4">
                        <StatCard label="Appointments Booked" value={data.receptionist._count.appointments} color="purple" />
                        <StatCard
                          label="Upcoming Bookings"
                          value={data.receptionist.appointments?.filter((a: any) => a.status === "SCHEDULED").length ?? 0}
                          color="blue"
                        />
                      </div>
                    </Section>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ─── Sub-components ─────────────────────────────────────── */

function Section({ title, icon, color, children }: { title: string; icon: React.ReactNode; color: string; children: React.ReactNode }) {
  const colors: Record<string, string> = {
    blue: "text-[#1E4A8A] dark:text-[#4A8AC8] bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800",
    emerald: "text-[#2D8A6E] dark:text-[#4AA88A] bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800",
    purple: "text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-800",
  };
  return (
    <div>
      <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest w-fit mb-3 ${colors[color]}`}>
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}

function InfoGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>;
}

function InfoItem({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: string; highlight?: string }) {
  const hl = highlight === "emerald" ? "text-[#2D8A6E] dark:text-[#4AA88A]" : highlight === "blue" ? "text-[#1E4A8A] dark:text-[#4A8AC8]" : "text-[#1A2A4A] dark:text-[#E8EEF8]";
  return (
    <div className="flex items-start gap-3 p-3 bg-[#F0F4F8] dark:bg-[#0A122A] rounded-xl">
      <span className="text-[#5A6E8A] dark:text-[#8A9CBA] mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[9px] font-black uppercase tracking-widest text-[#5A6E8A] dark:text-[#8A9CBA]">{label}</p>
        <p className={`font-bold text-sm truncate ${hl}`}>{value}</p>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    blue: "text-[#1E4A8A] dark:text-[#4A8AC8] bg-blue-50 dark:bg-blue-900/20",
    emerald: "text-[#2D8A6E] dark:text-[#4AA88A] bg-emerald-50 dark:bg-emerald-900/20",
    amber: "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20",
    purple: "text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/20",
  };
  return (
    <div className={`p-4 rounded-2xl ${colors[color]}`}>
      <p className="text-3xl font-black tracking-tighter">{value}</p>
      <p className="text-[9px] font-black uppercase tracking-widest mt-1 opacity-70">{label}</p>
    </div>
  );
}
