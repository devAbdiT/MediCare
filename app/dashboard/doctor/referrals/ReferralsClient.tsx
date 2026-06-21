"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

export default function ReferralsClient({ doctorId, departmentId }: { doctorId: string, departmentId: string | null }) {
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"INCOMING" | "OUTGOING">("INCOMING");
  const router = useRouter();

  const fetchReferrals = async () => {
    try {
      const res = await fetch("/api/referrals");
      if (res.ok) setReferrals(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, []);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/referrals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchReferrals();
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const incoming = referrals.filter(r => r.toDoctorId === doctorId || r.toDepartmentId === departmentId);
  const outgoing = referrals.filter(r => r.fromDoctorId === doctorId);

  const displayed = activeTab === "INCOMING" ? incoming : outgoing;

  const UrgencyBadge = ({ urgency }: { urgency: string }) => {
    const colors: Record<string, string> = {
      EMERGENCY: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      URGENT: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      ROUTINE: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
    };
    return (
      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${colors[urgency] || colors.ROUTINE}`}>
        {urgency}
      </span>
    );
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const colors: Record<string, string> = {
      PENDING: "bg-[#F0F4F8] text-[#5A6E8A] dark:bg-[#111C3A] dark:text-[#8A9CBA]",
      ACCEPTED: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
      COMPLETED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
      CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
    };
    return (
      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-[#D0DCE8] dark:border-[#1A2A4A] ${colors[status] || colors.PENDING}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-[#111C3A] rounded-[2.5rem] border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-sm overflow-hidden">
      <div className="flex border-b border-[#D0DCE8] dark:border-[#1A2A4A]">
        <button 
          onClick={() => setActiveTab("INCOMING")}
          className={`flex-1 py-4 text-sm font-bold transition-colors ${activeTab === "INCOMING" ? "text-[#1E4A8A] dark:text-[#4A8AC8] border-b-2 border-[#1E4A8A] dark:border-[#4A8AC8] bg-[#F0F4F8]/50 dark:bg-[#0A122A]/50" : "text-[#5A6E8A] dark:text-[#8A9CBA] hover:bg-[#F0F4F8] dark:hover:bg-[#0A122A]"}`}
        >
          Referred to Me {incoming.filter(r => r.status === "PENDING").length > 0 && <span className="ml-2 bg-red-500 text-white px-2 py-0.5 rounded-full text-xs">{incoming.filter(r => r.status === "PENDING").length}</span>}
        </button>
        <button 
          onClick={() => setActiveTab("OUTGOING")}
          className={`flex-1 py-4 text-sm font-bold transition-colors ${activeTab === "OUTGOING" ? "text-[#1E4A8A] dark:text-[#4A8AC8] border-b-2 border-[#1E4A8A] dark:border-[#4A8AC8] bg-[#F0F4F8]/50 dark:bg-[#0A122A]/50" : "text-[#5A6E8A] dark:text-[#8A9CBA] hover:bg-[#F0F4F8] dark:hover:bg-[#0A122A]"}`}
        >
          Sent by Me
        </button>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map(i => <div key={i} className="h-16 bg-[#F0F4F8] dark:bg-[#0A122A] rounded-xl"></div>)}
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-12 text-[#5A6E8A] dark:text-[#8A9CBA]">
            <p>No referrals found in this category.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-widest border-b border-[#D0DCE8] dark:border-[#1A2A4A]">
                <tr>
                  <th className="px-4 py-4">Patient</th>
                  <th className="px-4 py-4">{activeTab === "INCOMING" ? "From" : "To"}</th>
                  <th className="px-4 py-4">Reason</th>
                  <th className="px-4 py-4">Urgency</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4">Date</th>
                  <th className="px-4 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((ref) => (
                  <tr key={ref.id} className="border-b border-[#D0DCE8] dark:border-[#1A2A4A] hover:bg-[#F0F4F8]/50 dark:hover:bg-[#0A122A]/50 transition-colors">
                    <td className="px-4 py-4 font-bold text-[#1A2A4A] dark:text-[#E8EEF8]">{ref.patient.user.name}</td>
                    <td className="px-4 py-4 text-[#5A6E8A] dark:text-[#8A9CBA]">
                      {activeTab === "INCOMING" ? `Dr. ${ref.fromDoctor.user.name}` : (ref.toDoctor ? `Dr. ${ref.toDoctor.user.name}` : ref.toDepartment?.name || 'Department')}
                    </td>
                    <td className="px-4 py-4 text-[#1A2A4A] dark:text-[#E8EEF8] max-w-[200px] truncate">{ref.reason}</td>
                    <td className="px-4 py-4"><UrgencyBadge urgency={ref.urgency} /></td>
                    <td className="px-4 py-4"><StatusBadge status={ref.status} /></td>
                    <td className="px-4 py-4 text-[#5A6E8A] dark:text-[#8A9CBA]">{format(new Date(ref.createdAt), "MMM dd, yyyy")}</td>
                    <td className="px-4 py-4 text-right space-x-2">
                      {activeTab === "INCOMING" && ref.status === "PENDING" && (
                        <button onClick={() => handleUpdateStatus(ref.id, "ACCEPTED")} className="px-3 py-1.5 bg-[#1E4A8A] text-white hover:bg-[#16386b] rounded-lg font-bold text-xs">Accept</button>
                      )}
                      {activeTab === "INCOMING" && ref.status === "ACCEPTED" && (
                        <button onClick={() => handleUpdateStatus(ref.id, "COMPLETED")} className="px-3 py-1.5 bg-teal-600 text-white hover:bg-teal-700 rounded-lg font-bold text-xs">Complete</button>
                      )}
                      {activeTab === "OUTGOING" && ref.status === "PENDING" && (
                        <button onClick={() => handleUpdateStatus(ref.id, "CANCELLED")} className="px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg font-bold text-xs">Cancel</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
