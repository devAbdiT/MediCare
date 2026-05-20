// app/dashboard/receptionist/search/page.tsx
"use client";

import React, { useState, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { SearchBar } from "@/components/SearchBar";
import {
  Search,
  User,
  Phone,
  Mail,
  Loader2,
  CalendarPlus,
  Droplets,
  CreditCard,
  Hash,
} from "lucide-react";
import Link from "next/link";

export default function SearchPatients() {
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

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
  }, []);

  return (
    <DashboardLayout role="receptionist">
      <div className="space-y-8 max-w-5xl mx-auto pb-10">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-black text-[#1A2A4A] dark:text-[#E8EEF8] tracking-tight flex items-center gap-4">
            <Search className="text-[#1E4A8A] dark:text-[#4A8AC8]" size={40} />
            Patient Search
          </h1>
          <p className="text-[#5A6E8A] dark:text-[#8A9CBA] mt-2 text-lg font-medium">
            Find patient records by name, email, or phone number.
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-white dark:bg-[#111C3A] p-8 rounded-[2.5rem] border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-sm transition-colors duration-500">
          <SearchBar
            onSearch={handleSearch}
            isSearching={isSearching}
            placeholder="Type a name, email, or phone..."
          />
        </div>

        {/* Loading */}
        {isSearching && (
          <div className="flex items-center justify-center gap-3 py-20 text-[#5A6E8A] dark:text-[#8A9CBA]">
            <Loader2 size={28} className="animate-spin text-[#1E4A8A] dark:text-[#4A8AC8]" />
            <span className="font-bold text-lg">Searching records...</span>
          </div>
        )}

        {/* Empty state */}
        {!isSearching && hasSearched && results.length === 0 && (
          <div className="py-24 text-center bg-white dark:bg-[#111C3A] rounded-[2.5rem] border-2 border-dashed border-[#D0DCE8] dark:border-[#1A2A4A]">
            <Search size={40} className="mx-auto text-[#D0DCE8] dark:text-[#1A2A4A] mb-4" />
            <p className="text-[#5A6E8A] dark:text-[#8A9CBA] font-bold text-lg">
              No patients found
            </p>
            <p className="text-[#8A9CBA] dark:text-[#5A6E8A] text-sm mt-1">
              Try searching by a different name, email, or phone number.
            </p>
          </div>
        )}

        {/* Prompt before any search */}
        {!isSearching && !hasSearched && (
          <div className="py-20 text-center bg-white dark:bg-[#111C3A] rounded-[2.5rem] border border-[#D0DCE8] dark:border-[#1A2A4A]">
            <Search size={40} className="mx-auto text-[#D0DCE8] dark:text-[#1A2A4A] mb-4" />
            <p className="text-[#5A6E8A] dark:text-[#8A9CBA] font-bold">
              Start typing to search for a patient
            </p>
          </div>
        )}

        {/* Results */}
        {!isSearching && results.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {results.map((patient) => (
              <div
                key={patient.id}
                className="bg-white dark:bg-[#111C3A] p-6 rounded-[2.5rem] border border-[#D0DCE8] dark:border-[#1A2A4A] hover:border-[#1E4A8A] dark:hover:border-[#4A8AC8] hover:shadow-lg transition-all group"
              >
                {/* Card Header */}
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-[#1E4A8A] dark:text-[#4A8AC8] flex items-center justify-center font-black text-2xl shrink-0 group-hover:scale-105 transition-transform">
                    {patient.name?.charAt(0) ?? "?"}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-black text-lg text-[#1A2A4A] dark:text-[#E8EEF8] truncate">
                      {patient.name}
                    </h3>
                    {patient.cardNumber && (
                      <span className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-black rounded-lg uppercase tracking-widest">
                        <CreditCard size={10} />
                        {patient.cardNumber}
                      </span>
                    )}
                  </div>
                </div>

                {/* Contact Details */}
                <div className="space-y-2 mb-5">
                  <div className="flex items-center gap-3 text-sm text-[#5A6E8A] dark:text-[#8A9CBA] font-medium">
                    <Mail size={14} className="shrink-0" />
                    <span className="truncate">{patient.email}</span>
                  </div>
                  {patient.phone && (
                    <div className="flex items-center gap-3 text-sm text-[#5A6E8A] dark:text-[#8A9CBA] font-medium">
                      <Phone size={14} className="shrink-0" />
                      {patient.phone}
                    </div>
                  )}
                  {patient.bloodType && (
                    <div className="flex items-center gap-3 text-sm font-bold text-red-500 dark:text-red-400">
                      <Droplets size={14} className="shrink-0" />
                      {patient.bloodType}
                    </div>
                  )}
                  {patient.age !== undefined && patient.age !== null && (
                    <div className="flex items-center gap-3 text-sm text-[#5A6E8A] dark:text-[#8A9CBA] font-medium">
                      <Hash size={14} className="shrink-0" />
                      {patient.age} years old
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-[#F0F4F8] dark:border-[#0A122A]">
                  <Link
                    href={`/dashboard/receptionist/book-appointment?patientId=${patient.id}`}
                    className="flex-1"
                  >
                    <button className="w-full py-3 bg-[#1E4A8A] dark:bg-[#4A8AC8] hover:bg-[#0F3A6A] dark:hover:bg-[#1E4A8A] text-white rounded-2xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#1E4A8A]/10">
                      <CalendarPlus size={14} />
                      Book Appointment
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
