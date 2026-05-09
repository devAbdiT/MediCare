"use client";

import React, { useState } from "react";
import { toast } from "sonner";

export default function AdminControls() {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateAudit = async () => {
    setIsGenerating(true);
    toast.promise(
      new Promise(async (resolve, reject) => {
        try {
          // Fetch the audit data from an API (or we can just mock the CSV string here for demonstration)
          const res = await fetch('/api/admin/audit');
          if (!res.ok) throw new Error("Failed to fetch audit data");
          
          const blob = await res.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `system_audit_${new Date().toISOString().split('T')[0]}.csv`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          resolve(true);
        } catch (error) {
          reject(error);
        } finally {
          setIsGenerating(false);
        }
      }),
      {
        loading: 'Compiling system audit logs into CSV...',
        success: 'Audit report downloaded successfully!',
        error: 'Failed to generate audit',
      }
    );
  };

  return (
    <div className="flex gap-4">
      <button 
        onClick={handleGenerateAudit}
        disabled={isGenerating}
        className="bg-[#1E4A8A] hover:bg-[#0F3A6A] dark:bg-[#4A8AC8] dark:hover:bg-[#5A9AD8] text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-[#1E4A8A]/20 disabled:opacity-50"
      >
        {isGenerating ? "Generating..." : "Generate Audit"}
      </button>
      <button 
        onClick={() => toast.info("API Documentation is not available in this environment.")}
        className="bg-white/5 hover:bg-white/10 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest border border-white/10 transition-all"
      >
        API Docs
      </button>
    </div>
  );
}
