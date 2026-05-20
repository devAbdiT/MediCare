"use client";

import React, { useState, useCallback } from "react";
import { SearchBar } from "@/components/SearchBar";
import { CalendarPlus, User, Loader2 } from "lucide-react";
import Link from "next/link";

export function ReceptionistDashboardSearch() {
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // useCallback is CRITICAL — SearchBar's useEffect watches this reference.
  // Without it, a new function is created every render → infinite search loop.
  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);
    try {
      const res = await fetch(`/api/patients/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setResults(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []); // empty deps = stable reference forever

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-[#1E293B] p-8 rounded-[2.5rem] border border-[#E2E8F0] dark:border-[#334155] shadow-sm transition-colors duration-500">
        <h2 className="text-xl font-black text-[#1E293B] dark:text-[#F1F5F9] mb-5 tracking-tight">
          Quick Patient Search
        </h2>

        <SearchBar
          onSearch={handleSearch}
          isSearching={isSearching}
          placeholder="Search by name, email, or phone..."
        />

        {/* Loading */}
        {isSearching && (
          <div className="flex items-center gap-3 mt-6 text-[#64748B] dark:text-[#94A3B8]">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-sm font-bold">Searching patients...</span>
          </div>
        )}

        {/* No results */}
        {!isSearching && hasSearched && results.length === 0 && (
          <div className="mt-5 text-center py-8 bg-[#F8FAFC] dark:bg-[#0F172A] rounded-2xl border border-dashed border-[#E2E8F0] dark:border-[#334155]">
            <p className="text-[#64748B] dark:text-[#94A3B8] font-bold text-sm">
              No patients found matching your search.
            </p>
          </div>
        )}

        {/* Results list */}
        {!isSearching && results.length > 0 && (
          <div className="mt-5 space-y-3">
            {results.map((patient) => (
              <div
                key={patient.id}
                className="p-5 rounded-2xl bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-[#3B82F6] dark:hover:border-[#60A5FA] transition-all"
              >
                {/* Patient info */}
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-2xl flex items-center justify-center font-black text-lg shrink-0">
                    {patient.name?.charAt(0) ?? "?"}
                  </div>
                  <div>
                    <h3 className="font-bold text-[#1E293B] dark:text-[#F1F5F9]">
                      {patient.name}
                    </h3>
                    <p className="text-xs font-medium text-[#64748B] dark:text-[#94A3B8]">
                      {patient.email}
                      {patient.phone && <> &bull; {patient.phone}</>}
                    </p>
                    {patient.cardNumber && (
                      <span className="inline-block mt-1 px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-black rounded-lg uppercase tracking-widest">
                        {patient.cardNumber}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                  <Link
                    href={`/dashboard/receptionist/book-appointment?patientId=${patient.id}`}
                    className="flex-1 sm:flex-none"
                  >
                    <button className="w-full px-4 py-2.5 bg-[#3B82F6] hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-md shadow-blue-500/10">
                      <CalendarPlus size={14} />
                      Book
                    </button>
                  </Link>
                  <Link
                    href={`/dashboard/receptionist/search?q=${encodeURIComponent(patient.name)}`}
                    className="flex-1 sm:flex-none"
                  >
                    <button className="w-full px-4 py-2.5 bg-[#E2E8F0] dark:bg-[#334155] hover:bg-[#CBD5E1] dark:hover:bg-[#475569] text-[#1E293B] dark:text-[#F1F5F9] rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2">
                      <User size={14} />
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
