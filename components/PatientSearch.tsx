"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Loader2, X, User as UserIcon } from "lucide-react";

export interface PatientSearchResult {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  bloodType: string | null;
  cardNumber: string | null;
}

interface PatientSearchProps {
  onSelect: (patient: PatientSearchResult) => void;
  selectedPatientId?: string;
  className?: string;
}

export function PatientSearch({ onSelect, selectedPatientId, className = "" }: PatientSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PatientSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientSearchResult | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  // Fetch initial selected patient if ID provided
  useEffect(() => {
    if (selectedPatientId && !selectedPatient) {
      fetch(`/api/patients/${selectedPatientId}`)
        .then(res => res.json())
        .then(data => {
          if (data && !data.error) {
            const formatted = {
              id: data.id,
              name: data.user.name,
              email: data.user.email,
              phone: data.user.phone,
              bloodType: data.bloodType,
              cardNumber: data.cardNumber
            };
            setSelectedPatient(formatted);
            onSelect(formatted);
          }
        })
        .catch(console.error);
    }
  }, [selectedPatientId]);

  // Handle outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length > 0) {
        setLoading(true);
        fetch(`/api/patients/search?q=${encodeURIComponent(query)}`)
          .then(res => res.json())
          .then(data => {
            setResults(Array.isArray(data) ? data : []);
            setShowDropdown(true);
          })
          .catch(console.error)
          .finally(() => setLoading(false));
      } else {
        setResults([]);
        setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (patient: PatientSearchResult) => {
    setSelectedPatient(patient);
    setQuery("");
    setShowDropdown(false);
    onSelect(patient);
  };

  const handleClear = () => {
    setSelectedPatient(null);
    setQuery("");
    // We should probably pass null, but we'll assume the parent handles it if needed
  };

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      {selectedPatient ? (
        <div className="flex items-center justify-between p-4 bg-emerald-50 border-2 border-emerald-500 rounded-2xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
              {selectedPatient.name.charAt(0)}
            </div>
            <div>
              <p className="font-bold text-slate-900">{selectedPatient.name}</p>
              <div className="flex gap-3 mt-1 text-xs font-medium text-slate-600">
                <span>{selectedPatient.phone || selectedPatient.email}</span>
                <span>•</span>
                <span className="text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
                  {selectedPatient.cardNumber || "No Card"}
                </span>
                {selectedPatient.bloodType && (
                  <>
                    <span>•</span>
                    <span className="text-red-600 font-bold">{selectedPatient.bloodType}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <button 
            type="button"
            onClick={handleClear}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => { if (results.length > 0) setShowDropdown(true); }}
            className="w-full pl-12 pr-12 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-600 outline-none transition-all font-medium text-slate-900"
            placeholder="Search patient by name, email, or phone..."
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-4">
            {loading ? <Loader2 className="h-5 w-5 text-blue-600 animate-spin" /> : null}
          </div>

          {/* Dropdown Results */}
          {showDropdown && (query.length > 0 || results.length > 0) && (
            <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 shadow-xl rounded-2xl max-h-[300px] overflow-y-auto custom-scrollbar">
              {results.length === 0 && !loading ? (
                <div className="p-6 text-center text-slate-500 font-medium">
                  No patients found matching "{query}"
                </div>
              ) : (
                <div className="py-2">
                  {results.map((patient) => (
                    <button
                      key={patient.id}
                      type="button"
                      onClick={() => handleSelect(patient)}
                      className="w-full text-left px-6 py-4 hover:bg-blue-50 transition-colors flex items-center gap-4 border-b border-slate-50 last:border-0"
                    >
                      <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold">
                        {patient.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-slate-900">{patient.name}</p>
                        <p className="text-xs text-slate-500 font-medium flex gap-2">
                          <span>{patient.email}</span>
                          {patient.phone && <span>• {patient.phone}</span>}
                        </p>
                      </div>
                      <div className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">
                        {patient.cardNumber || "New"}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
