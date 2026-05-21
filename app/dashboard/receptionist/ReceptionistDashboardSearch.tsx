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
      <div className="bg-[#F0F4F8] dark:bg-[#0A122A] p-8 rounded-[2.5rem] border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-sm transition-colors duration-500">
        <h2 className="text-xl font-black text-[#1A2A4A] dark:text-[#E8EEF8] mb-5 tracking-tight">
          Quick Patient Search
        </h2>

        <SearchBar
          onSearch={handleSearch}
          isSearching={isSearching}
          placeholder="Search by name, email, or phone..."
        />

        {/* Loading */}
        {isSearching && (
          <div className="flex items-center gap-3 mt-6 text-[#5A6E8A] dark:text-[#8A9CBA]">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-sm font-bold">Searching patients...</span>
          </div>
        )}

        {/* No results */}
        {!isSearching && hasSearched && results.length === 0 && (
          <div className="mt-5 text-center py-8 bg-white dark:bg-[#111C3A] rounded-2xl border border-dashed border-[#D0DCE8] dark:border-[#1A2A4A]">
            <p className="text-[#5A6E8A] dark:text-[#8A9CBA] font-bold text-sm">
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
                className="p-5 rounded-2xl bg-white dark:bg-[#111C3A] border border-[#D0DCE8] dark:border-[#1A2A4A] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-[#1E4A8A] dark:hover:border-[#4A8AC8] transition-all"
              >
                {/* Patient info */}
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-[#1E4A8A]/10 dark:bg-[#4A8AC8]/10 text-[#1E4A8A] dark:text-[#4A8AC8] rounded-2xl flex items-center justify-center font-black text-lg shrink-0">
                    {patient.name?.charAt(0) ?? "?"}
                  </div>
                  <div>
                    <h3 className="font-bold text-[#1A2A4A] dark:text-[#E8EEF8]">
                      {patient.name}
                    </h3>
                    <p className="text-xs font-medium text-[#5A6E8A] dark:text-[#8A9CBA]">
                      {patient.email}
                      {patient.phone && <> &bull; {patient.phone}</>}
                    </p>
                    {patient.cardNumber && (
                      <span className="inline-block mt-1 px-2.5 py-0.5 bg-emerald-500/10 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black rounded-lg uppercase tracking-widest">
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
                    <button className="w-full px-4 py-2.5 bg-[#1E4A8A] dark:bg-[#4A8AC8] hover:bg-[#1A3F75] dark:hover:bg-[#3B72A8] text-white dark:text-[#0A122A] rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-md shadow-blue-500/10">
                      <CalendarPlus size={14} />
                      Book
                    </button>
                  </Link>
                  <Link
                    href={`/dashboard/receptionist/search?q=${encodeURIComponent(patient.name)}`}
                    className="flex-1 sm:flex-none"
                  >
                    <button className="w-full px-4 py-2.5 bg-[#F0F4F8] dark:bg-[#0A122A] hover:bg-[#D0DCE8] dark:hover:bg-[#1A2A4A] text-[#1E4A8A] dark:text-[#4A8AC8] border border-[#D0DCE8] dark:border-[#1A2A4A] rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2">
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
