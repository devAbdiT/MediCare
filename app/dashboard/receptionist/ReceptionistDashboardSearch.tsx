"use client";

import React, { useState } from "react";
import { SearchBar } from "@/components/SearchBar";
import { User, CalendarPlus, Activity } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function ReceptionistDashboardSearch() {
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();

  const handleSearch = async (query: string) => {
    if (!query) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`/api/patients/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#1E293B] p-8 rounded-[2.5rem] border border-[#E2E8F0] dark:border-[#334155] shadow-sm">
        <h2 className="text-2xl font-black text-[#1E293B] dark:text-[#F1F5F9] mb-6">Patient Search</h2>
        <SearchBar onSearch={handleSearch} isSearching={isSearching} placeholder="Search patients by name, email, or phone..." />
        
        {results.length > 0 && (
          <div className="mt-8 space-y-4">
            {results.map((patient) => (
              <div key={patient.id} className="p-6 rounded-3xl bg-slate-50 dark:bg-[#0F172A] border border-slate-100 dark:border-[#334155] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center font-black text-lg">
                    {patient.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">{patient.name}</h3>
                    <p className="text-sm font-medium text-slate-500">
                      {patient.email} {patient.phone && `• ${patient.phone}`}
                    </p>
                    <span className="inline-block mt-1 px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded">
                      Card: {patient.cardNumber || "N/A"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <Link href={`/dashboard/receptionist/book-appointment?patientId=${patient.id}`} className="flex-1 md:flex-none">
                    <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                      <CalendarPlus size={16} />
                      Book
                    </button>
                  </Link>
                  <Link href={`/dashboard/admin/users/${patient.id}`} className="flex-1 md:flex-none">
                    <button className="w-full px-4 py-2 bg-slate-200 text-slate-800 rounded-xl font-bold text-sm hover:bg-slate-300 transition-colors flex items-center justify-center gap-2">
                      <User size={16} />
                      Profile
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
