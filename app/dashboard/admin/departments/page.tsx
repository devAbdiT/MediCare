"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Plus, Edit2, Trash2, Building2, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function AdminDepartmentsPage() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<any>(null);
  
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDepartments = async () => {
    try {
      const res = await fetch("/api/departments");
      const data = await res.json();
      setDepartments(data);
    } catch (err) {
      toast.error("Failed to load departments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const url = editingDept ? `/api/departments/${editingDept.id}` : "/api/departments";
      const method = editingDept ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        toast.success(editingDept ? "Department updated" : "Department created");
        setIsAddOpen(false);
        setEditingDept(null);
        setFormData({ name: "", description: "" });
        fetchDepartments();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to save");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the ${name} department?`)) return;
    
    try {
      const res = await fetch(`/api/departments/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Department deleted");
        fetchDepartments();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete");
      }
    } catch (err) {
      toast.error("An error occurred");
    }
  };

  const openEdit = (dept: any) => {
    setEditingDept(dept);
    setFormData({ name: dept.name, description: dept.description || "" });
    setIsAddOpen(true);
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8 pb-12 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-[#111C3A] p-8 rounded-[2.5rem] border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-sm transition-colors duration-500">
          <div>
            <h1 className="text-4xl font-black text-[#1A2A4A] dark:text-[#E8EEF8] tracking-tight">Clinical Departments</h1>
            <p className="text-[#5A6E8A] dark:text-[#8A9CBA] mt-2 font-medium">Manage hospital divisions and specializations.</p>
          </div>

          <Dialog open={isAddOpen} onOpenChange={(open) => { setIsAddOpen(open); if(!open) setEditingDept(null); }}>
            <DialogTrigger asChild>
              <button 
                onClick={() => { setEditingDept(null); setFormData({ name: "", description: "" }); }}
                className="flex items-center gap-2 px-6 py-4 bg-[#1E4A8A] hover:bg-[#0F3A6A] text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-lg shadow-[#1E4A8A]/20"
              >
                <Plus size={18} />
                Add New
              </button>
            </DialogTrigger>
            <DialogContent className="bg-white dark:bg-[#111C3A] border-none rounded-[2rem] max-w-md">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black text-[#1A2A4A] dark:text-white">
                  {editingDept ? "Edit Department" : "New Department"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSave} className="space-y-6 mt-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#5A6E8A] uppercase tracking-widest">Department Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-4 bg-[#F0F4F8] dark:bg-[#0A122A] rounded-2xl border border-transparent focus:border-[#1E4A8A] outline-none font-bold text-[#1A2A4A] dark:text-white"
                    placeholder="e.g. Cardiology"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#5A6E8A] uppercase tracking-widest">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full p-4 bg-[#F0F4F8] dark:bg-[#0A122A] rounded-2xl border border-transparent focus:border-[#1E4A8A] outline-none font-bold text-[#1A2A4A] dark:text-white resize-none"
                    placeholder="Optional details..."
                    rows={3}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-[#1E4A8A] text-white rounded-2xl font-black uppercase tracking-widest hover:bg-[#0F3A6A] transition-all flex justify-center items-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : (editingDept ? "Save Changes" : "Create Department")}
                </button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin text-[#1E4A8A]" size={40} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {departments.map((dept) => (
              <div key={dept.id} className="bg-white dark:bg-[#111C3A] p-8 rounded-[2.5rem] border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-sm hover:border-[#1E4A8A] dark:hover:border-[#4A8AC8] transition-colors group flex flex-col">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-[#1E4A8A]/20 text-[#1E4A8A] dark:text-[#4A8AC8] flex items-center justify-center">
                    <Building2 size={24} />
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => openEdit(dept)}
                      className="p-2 text-[#5A6E8A] hover:bg-[#F0F4F8] dark:hover:bg-[#0A122A] rounded-xl transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(dept.id, dept.name)}
                      className="p-2 text-[#D94A5A] hover:bg-[#D94A5A]/10 rounded-xl transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <h2 className="text-2xl font-black text-[#1A2A4A] dark:text-[#E8EEF8] mb-4">{dept.name}</h2>
                
                <div className="space-y-4 mb-8 flex-1">
                  {dept.doctors.length === 0 ? (
                    <p className="text-sm font-bold text-[#5A6E8A]/50 italic border-l-2 border-[#D0DCE8] dark:border-[#1A2A4A] pl-4">No doctors assigned yet.</p>
                  ) : (
                    dept.doctors.map((doc: any) => (
                      <div key={doc.id} className="flex items-start gap-3 relative before:absolute before:left-[11px] before:top-6 before:bottom-[-16px] before:w-[2px] before:bg-[#D0DCE8] dark:before:bg-[#1A2A4A] last:before:hidden">
                        <div className="w-6 h-6 rounded-full bg-[#F0F4F8] dark:bg-[#0A122A] text-[#1E4A8A] dark:text-[#4A8AC8] flex items-center justify-center shrink-0 mt-0.5 z-10">
                          <Users size={10} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#1A2A4A] dark:text-[#E8EEF8]">{doc.user.name}</p>
                          <p className="text-[10px] font-black text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-widest">{doc.specialization}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-6 border-t border-[#D0DCE8] dark:border-[#1A2A4A] flex justify-between items-center mt-auto">
                  <span className="text-xs font-black text-[#5A6E8A] uppercase tracking-widest">Total Staff</span>
                  <span className="px-3 py-1 bg-[#F0F4F8] dark:bg-[#0A122A] text-[#1A2A4A] dark:text-[#E8EEF8] rounded-lg font-black text-xs">
                    {dept.doctors.length} Doctors
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
