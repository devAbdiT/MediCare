// app/dashboard/receptionist/search/page.tsx
"use client";

import React, { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, User, Phone, Mail, Loader2, Calendar } from "lucide-react";
import { format } from "date-fns";

export default function SearchPatients() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/patients/search?q=${query}`);
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout role="receptionist">
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Search Patients</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg font-medium">Find patient records by name, email, or phone number.</p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={20} />
            <Input 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search patients..." 
              className="h-14 pl-12 rounded-2xl shadow-sm border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 focus:border-blue-600 transition-all" 
            />
          </div>
          <Button 
            type="submit" 
            disabled={loading}
            className="h-14 px-8 rounded-2xl bg-slate-900 dark:bg-blue-600 text-white font-bold hover:bg-slate-800 dark:hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/10"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Search"}
          </Button>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.length === 0 && !loading && query !== "" && (
            <div className="col-span-full py-20 text-center text-slate-400 dark:text-slate-500 font-medium bg-slate-50/50 dark:bg-slate-900/30 rounded-[2.5rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
              No patients found matching your search.
            </div>
          )}

          {results.map((patient) => (
            <div key={patient.id} className="bg-white dark:bg-[#0F172A] p-6 rounded-3xl border border-slate-100 dark:border-slate-800 hover:shadow-xl hover:border-blue-200 dark:hover:border-blue-900 transition-all group">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black">
                  {patient.user.name[0]}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100">{patient.user.name}</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">
                    ID: {patient.id.slice(-6).toUpperCase()}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400 font-medium">
                  <Phone size={14} className="text-slate-400 dark:text-slate-500" />
                  {patient.user.phone}
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400 font-medium">
                  <Mail size={14} className="text-slate-400 dark:text-slate-500" />
                  {patient.user.email}
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400 font-medium">
                  <Calendar size={14} className="text-slate-400 dark:text-slate-500" />
                  DOB: {format(new Date(patient.dateOfBirth), "MMM dd, yyyy")}
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-50 dark:border-slate-800 flex gap-2">
                <Button variant="outline" className="flex-1 rounded-xl font-bold text-xs h-10 border-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800">
                  Profile
                </Button>
                <Button className="flex-1 rounded-xl font-bold text-xs h-10 bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20">
                  Book Visit
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
