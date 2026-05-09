"use client";

import React, { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { SearchBar } from "@/components/SearchBar";
import { User, ClipboardList } from "lucide-react";
import Link from "next/link";

export default function DoctorPatientsPage() {
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

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
    <DashboardLayout role="doctor">
      <div className="max-w-5xl mx-auto space-y-8 pb-12">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Patient Search</h1>
          <p className="text-slate-500 mt-2 text-lg font-medium">Find patient records and history across the entire clinic network.</p>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <SearchBar onSearch={handleSearch} isSearching={isSearching} placeholder="Search patients by name, email, or phone..." />
          
          {results.length > 0 && (
            <div className="mt-8 space-y-4">
              {results.map((patient) => (
                <div key={patient.id} className="p-6 rounded-3xl bg-slate-50 border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-blue-200 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center font-black text-lg">
                      {patient.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{patient.name}</h3>
                      <p className="text-sm font-medium text-slate-500">
                        {patient.email} {patient.phone && `• ${patient.phone}`}
                      </p>
                      <span className="inline-block mt-1 px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded">
                        Card: {patient.cardNumber || "N/A"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <Link href={`/dashboard/admin/users/${patient.id}`} className="flex-1 md:flex-none">
                      <button className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                        <ClipboardList size={16} />
                        View Medical Profile
                      </button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {results.length === 0 && !isSearching && (
            <div className="text-center py-20">
              <User size={48} className="mx-auto text-slate-200 mb-4" />
              <p className="text-slate-500 font-bold">Search above to view patient medical history.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
