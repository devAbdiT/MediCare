"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Edit, Power, PowerOff, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface Drug {
  id: string;
  name: string;
  genericName?: string;
  category: string;
  form: string;
  strength?: string;
  unit: string;
  reorderLevel: number;
  isActive: boolean;
  totalStock: number;
}

export default function PharmacyDrugsPage() {
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    genericName: "",
    category: "",
    form: "TABLET",
    strength: "",
    unit: "mg",
    reorderLevel: "10",
  });

  const fetchDrugs = async () => {
    try {
      const url = new URL("/api/pharmacy/drugs", window.location.origin);
      if (search) url.searchParams.append("q", search);
      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setDrugs(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchDrugs();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/pharmacy/drugs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      if (res.ok) fetchDrugs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/pharmacy/drugs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          reorderLevel: Number(formData.reorderLevel),
        }),
      });
      if (res.ok) {
        setIsAddOpen(false);
        setFormData({ name: "", genericName: "", category: "", form: "TABLET", strength: "", unit: "mg", reorderLevel: "10" });
        fetchDrugs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#1A2A4A] dark:text-[#E8EEF8] tracking-tight">Drug Catalogue</h1>
          <p className="text-[#5A6E8A] dark:text-[#8A9CBA] font-medium mt-1">Manage pharmacy inventory items and definitions.</p>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold rounded-xl transition-colors shadow-lg shadow-[#7C3AED]/20">
              <Plus size={18} />
              Add Drug
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] bg-white dark:bg-[#111C3A] border-[#D0DCE8] dark:border-[#1A2A4A]">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-[#1A2A4A] dark:text-[#E8EEF8]">Add New Drug</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <label className="text-xs font-bold uppercase text-[#5A6E8A] dark:text-[#8A9CBA]">Drug Name *</label>
                  <input required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 bg-[#F0F4F8] dark:bg-[#0A122A] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#7C3AED] dark:text-[#E8EEF8]" placeholder="e.g. Amoxicillin" />
                </div>
                <div className="space-y-2 col-span-2">
                  <label className="text-xs font-bold uppercase text-[#5A6E8A] dark:text-[#8A9CBA]">Generic Name</label>
                  <input value={formData.genericName} onChange={(e) => setFormData({...formData, genericName: e.target.value})} className="w-full px-4 py-2 bg-[#F0F4F8] dark:bg-[#0A122A] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#7C3AED] dark:text-[#E8EEF8]" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-[#5A6E8A] dark:text-[#8A9CBA]">Category *</label>
                  <input required value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-2 bg-[#F0F4F8] dark:bg-[#0A122A] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#7C3AED] dark:text-[#E8EEF8]" placeholder="e.g. Antibiotic" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-[#5A6E8A] dark:text-[#8A9CBA]">Form *</label>
                  <select required value={formData.form} onChange={(e) => setFormData({...formData, form: e.target.value})} className="w-full px-4 py-2 bg-[#F0F4F8] dark:bg-[#0A122A] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#7C3AED] dark:text-[#E8EEF8]">
                    <option value="TABLET">Tablet</option>
                    <option value="CAPSULE">Capsule</option>
                    <option value="LIQUID">Liquid</option>
                    <option value="INJECTION">Injection</option>
                    <option value="CREAM">Cream</option>
                    <option value="INHALER">Inhaler</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-[#5A6E8A] dark:text-[#8A9CBA]">Strength</label>
                  <input value={formData.strength} onChange={(e) => setFormData({...formData, strength: e.target.value})} className="w-full px-4 py-2 bg-[#F0F4F8] dark:bg-[#0A122A] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#7C3AED] dark:text-[#E8EEF8]" placeholder="e.g. 500" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-[#5A6E8A] dark:text-[#8A9CBA]">Unit *</label>
                  <input required value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})} className="w-full px-4 py-2 bg-[#F0F4F8] dark:bg-[#0A122A] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#7C3AED] dark:text-[#E8EEF8]" placeholder="e.g. mg, ml" />
                </div>
                <div className="space-y-2 col-span-2">
                  <label className="text-xs font-bold uppercase text-[#5A6E8A] dark:text-[#8A9CBA]">Reorder Level *</label>
                  <input required type="number" min="0" value={formData.reorderLevel} onChange={(e) => setFormData({...formData, reorderLevel: e.target.value})} className="w-full px-4 py-2 bg-[#F0F4F8] dark:bg-[#0A122A] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#7C3AED] dark:text-[#E8EEF8]" />
                </div>
              </div>
              <button type="submit" className="w-full py-3 mt-4 bg-[#7C3AED] text-white rounded-xl font-bold hover:bg-[#6D28D9] transition-colors">
                Save Drug Profile
              </button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white dark:bg-[#111C3A] rounded-[2rem] border border-[#D0DCE8] dark:border-[#1A2A4A] overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[#D0DCE8] dark:border-[#1A2A4A] bg-[#F8FAFC] dark:bg-[#0A122A]">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by name or generic name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border-none bg-white dark:bg-[#111C3A] text-sm focus:ring-2 focus:ring-[#7C3AED] outline-none dark:text-[#E8EEF8]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-[#5A6E8A] dark:text-[#8A9CBA] uppercase bg-[#F8FAFC] dark:bg-[#0A122A] border-b border-[#D0DCE8] dark:border-[#1A2A4A]">
              <tr>
                <th className="px-6 py-4 font-black tracking-wider">Drug Name</th>
                <th className="px-6 py-4 font-black tracking-wider">Generic</th>
                <th className="px-6 py-4 font-black tracking-wider">Form</th>
                <th className="px-6 py-4 font-black tracking-wider">Strength</th>
                <th className="px-6 py-4 font-black tracking-wider">Category</th>
                <th className="px-6 py-4 font-black tracking-wider text-right">Total Stock</th>
                <th className="px-6 py-4 font-black tracking-wider">Status</th>
                <th className="px-6 py-4 font-black tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-[#5A6E8A] dark:text-[#8A9CBA]">Loading catalogue...</td>
                </tr>
              ) : drugs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-[#5A6E8A] dark:text-[#8A9CBA]">No drugs found matching your search.</td>
                </tr>
              ) : (
                drugs.map((drug) => {
                  const isLowStock = drug.totalStock <= drug.reorderLevel;
                  return (
                    <tr key={drug.id} className="border-b border-[#F0F4F8] dark:border-[#1A2A4A] hover:bg-[#F8FAFC] dark:hover:bg-[#0A122A]/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-[#1A2A4A] dark:text-[#E8EEF8]">{drug.name}</td>
                      <td className="px-6 py-4 text-[#5A6E8A] dark:text-[#8A9CBA]">{drug.genericName || "-"}</td>
                      <td className="px-6 py-4 text-[#5A6E8A] dark:text-[#8A9CBA] capitalize">{drug.form.toLowerCase()}</td>
                      <td className="px-6 py-4 text-[#5A6E8A] dark:text-[#8A9CBA]">{drug.strength ? drug.strength + " " + drug.unit : "-"}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                          {drug.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isLowStock && <AlertTriangle size={14} className="text-red-500" />}
                          <span className={cn("font-bold text-base", isLowStock ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400")}>
                            {drug.totalStock}
                          </span>
                        </div>
                        <div className="text-[10px] text-[#5A6E8A] dark:text-[#8A9CBA] mt-0.5">
                          Min: {drug.reorderLevel}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {drug.isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span> Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleToggleStatus(drug.id, drug.isActive)}
                          className={cn(
                            "p-2 rounded-lg transition-colors border",
                            drug.isActive 
                              ? "text-red-600 hover:bg-red-50 border-red-200 dark:hover:bg-red-900/20 dark:border-red-900/30" 
                              : "text-emerald-600 hover:bg-emerald-50 border-emerald-200 dark:hover:bg-emerald-900/20 dark:border-emerald-900/30"
                          )}
                          title={drug.isActive ? "Deactivate" : "Activate"}
                        >
                          {drug.isActive ? <PowerOff size={16} /> : <Power size={16} />}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
