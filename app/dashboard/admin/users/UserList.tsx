// app/dashboard/admin/users/UserList.tsx
"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { User, Shield, Calendar, Phone, Mail, Search, Users, Stethoscope, Briefcase, Heart, Trash2, Loader2, Printer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PrintButton } from "@/components/admin/PrintButton";
import { PrintUserList } from "@/components/admin/PrintUserList";
import { PrintSingleUser } from "@/components/admin/PrintSingleUser";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface UserListProps {
  users: any[];
  adminName?: string;
}

export default function UserList({ users, adminName }: UserListProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [printingUser, setPrintingUser] = useState<any>(null);
  const [loadingPrint, setLoadingPrint] = useState(false);

  const fetchPrintData = async (userId: string) => {
    setLoadingPrint(true);
    try {
      const res = await fetch(`/api/print/user/${userId}`);
      const data = await res.json();
      setPrintingUser(data);
    } catch (error) {
      toast.error("Failed to fetch print manifest");
    } finally {
      setLoadingPrint(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete user: ${name}? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("User deleted successfully");
        router.refresh();
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to delete user");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesTab = activeTab === "ALL" || user.role === activeTab;
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const TabButton = ({ id, label, icon }: { id: string; label: string; icon: React.ReactNode }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
        activeTab === id 
          ? "bg-[#1E4A8A] text-white shadow-lg shadow-[#1E4A8A]/20 scale-105" 
          : "bg-white dark:bg-[#111C3A] text-[#5A6E8A] dark:text-[#8A9CBA] hover:bg-[#F0F4F8] dark:hover:bg-[#0A122A] border border-[#D0DCE8] dark:border-[#1A2A4A]"
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="space-y-8">
      {/* FR-33: Print-only Header for Lists */}
      <div className="print-only mb-10 pb-6 border-b-2 border-slate-900">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-black text-slate-900">Bosa Kito Health Center</h1>
            <p className="text-sm font-bold text-slate-600 uppercase tracking-widest mt-1">Clinical Manifest Report</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">Generated: {format(new Date(), "M/d/yyyy, h:mm a")}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-900 mt-1">Printed By: {adminName || "System Administrator"}</p>
          </div>
        </div>
      </div>

      {/* Filtering Header */}
      <div className="flex flex-col xl:flex-row justify-between gap-6">
        <div className="flex flex-wrap gap-3">
          <TabButton id="ALL" label="Global Manifest" icon={<Users size={16} />} />
          <TabButton id="PATIENT" label="Patients" icon={<Heart size={16} />} />
          <TabButton id="DOCTOR" label="Specialists" icon={<Stethoscope size={16} />} />
          <TabButton id="RECEPTIONIST" label="Front Desk" icon={<Briefcase size={16} />} />
        </div>

        <div className="relative group min-w-[300px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5A6E8A] group-focus-within:text-[#1E4A8A] transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-[#111C3A] border border-[#D0DCE8] dark:border-[#1A2A4A] rounded-2xl outline-none focus:border-[#1E4A8A] dark:focus:border-[#4A8AC8] font-bold text-[#1A2A4A] dark:text-[#E8EEF8] transition-all shadow-sm"
          />
        </div>

        {/* FR-31: Print All Patients/Doctors/Staff Dialog */}
        <div className="flex gap-2 no-print">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2 px-6 py-4 bg-white dark:bg-[#111C3A] text-[#1E4A8A] dark:text-[#4A8AC8] rounded-2xl font-black text-[10px] uppercase tracking-widest border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-sm hover:bg-[#F0F4F8] dark:hover:bg-[#0A122A] transition-all">
                <Printer size={16} />
                Print List Manifest
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border-none rounded-[2rem]">
              <DialogHeader>
                <DialogTitle className="text-xl font-black uppercase tracking-widest text-[#1A2A4A] dark:text-white border-b pb-4">Clinical Print Preview</DialogTitle>
              </DialogHeader>
              <PrintUserList 
                users={filteredUsers} 
                title={activeTab === "ALL" ? "Global Personnel Manifest" : `${activeTab.charAt(0) + activeTab.slice(1).toLowerCase()}s Directory`} 
              />
              <div className="flex justify-end gap-3 mt-6 no-print p-4">
                <PrintButton targetId="print-content" label="Execute Print" variant="default" className="bg-[#1E4A8A] text-white px-8 py-3 rounded-xl font-black uppercase text-xs" />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white dark:bg-[#111C3A] rounded-[2.5rem] border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-sm overflow-hidden transition-colors duration-500">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F0F4F8] dark:bg-[#0A122A] border-b border-[#D0DCE8] dark:border-[#1A2A4A] text-[#5A6E8A] dark:text-[#8A9CBA] text-[10px] font-black uppercase tracking-widest transition-colors duration-500">
                <th className="px-8 py-6">Identity</th>
                <th className="px-8 py-6">Role / Specialization</th>
                <th className="px-8 py-6">Address / Location</th>
                <th className="px-8 py-6">Telemetry/Contact</th>
                <th className="px-8 py-6">Registry Date</th>
                <th className="px-8 py-6 text-right no-print">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F4F8] dark:divide-[#0A122A]">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <p className="text-[#5A6E8A] dark:text-[#8A9CBA] font-bold italic">No matching records found in the current node.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-[#F0F4F8]/50 dark:hover:bg-[#0A122A]/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${roleColors[user.role as keyof typeof roleColors].bg} ${roleColors[user.role as keyof typeof roleColors].text}`}>
                          {user.name[0]}
                        </div>
                        <div>
                          <p className="font-bold text-[#1A2A4A] dark:text-[#E8EEF8]">{user.name}</p>
                          <p className="text-[10px] text-[#5A6E8A] dark:text-[#8A9CBA] font-black uppercase tracking-widest">ID-{user.id.slice(-6)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-1">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${roleColors[user.role as keyof typeof roleColors].bg} ${roleColors[user.role as keyof typeof roleColors].text}`}>
                          <Shield size={10} />
                          {user.role}
                        </div>
                        {user.doctor?.specialization && (
                          <p className="text-[10px] font-bold text-[#5A6E8A] dark:text-[#8A9CBA] mt-1">{user.doctor.specialization}</p>
                        )}
                        {user.patient?.bloodType && (
                          <p className="text-[10px] font-bold text-[#2D8A6E] dark:text-[#4AA88A] mt-1">Blood: {user.patient.bloodType.replace("_", "+")}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                       <p className="text-xs font-bold text-[#5A6E8A] dark:text-[#8A9CBA]">Jimma, Bosa Kito</p>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#5A6E8A] dark:text-[#8A9CBA]">
                          <Mail size={12} />
                          {user.email}
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-[#5A6E8A] dark:text-[#8A9CBA]">
                          <Phone size={12} />
                          {user.phone || "---"}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-xs font-black text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-tighter">
                        <Calendar size={14} />
                        {format(new Date(user.createdAt), "MMM dd, yyyy")}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right flex items-center justify-end gap-4">
                      <Link 
                        href={`/dashboard/admin/users/${user.id}`}
                        className="text-[#1E4A8A] dark:text-[#4A8AC8] text-[10px] font-black uppercase tracking-widest hover:underline"
                      >
                        View
                      </Link>

                      <Dialog>
                        <DialogTrigger asChild>
                          <button 
                            onClick={() => fetchPrintData(user.id)}
                            className="text-[#1E4A8A] dark:text-[#4A8AC8] text-[10px] font-black uppercase tracking-widest hover:underline"
                          >
                            Print Single
                          </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border-none rounded-[2rem]">
                          <DialogHeader>
                            <DialogTitle className="text-xl font-black uppercase tracking-widest text-[#1A2A4A] dark:text-white border-b pb-4">
                              Identity Manifest Preview
                            </DialogTitle>
                          </DialogHeader>
                          
                          {loadingPrint ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                               <Loader2 className="animate-spin text-[#1E4A8A]" size={40} />
                               <p className="text-sm font-black uppercase tracking-widest text-[#5A6E8A]">Compiling clinical data...</p>
                            </div>
                          ) : printingUser && (
                            <PrintSingleUser 
                              user={printingUser} 
                              appointments={printingUser.appointments} 
                            />
                          )}

                          <div className="flex justify-end gap-3 mt-6 no-print p-4">
                            <PrintButton 
                              targetId="print-content" 
                              label="Confirm & Print" 
                              variant="default" 
                              className="bg-[#1E4A8A] text-white px-8 py-3 rounded-xl font-black uppercase text-xs" 
                            />
                          </div>
                        </DialogContent>
                      </Dialog>
                      <button 
                        onClick={() => handleDelete(user.id, user.name)}
                        disabled={deletingId === user.id}
                        className="p-2.5 bg-[#D94A5A]/10 text-[#D94A5A] hover:bg-[#D94A5A] hover:text-white rounded-xl transition-all disabled:opacity-50"
                        title="Delete User"
                      >
                        {deletingId === user.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const roleColors = {
  ADMIN: { bg: "bg-slate-900", text: "text-white" },
  DOCTOR: { bg: "bg-blue-100 dark:bg-blue-900/40", text: "text-[#1E4A8A] dark:text-[#4A8AC8]" },
  RECEPTIONIST: { bg: "bg-purple-100 dark:bg-purple-900/40", text: "text-purple-700 dark:text-purple-300" },
  PATIENT: { bg: "bg-emerald-100 dark:bg-emerald-900/40", text: "text-[#2D8A6E] dark:text-[#4AA88A]" },
};
