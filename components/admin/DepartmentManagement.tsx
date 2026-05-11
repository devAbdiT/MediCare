// components/admin/DepartmentManagement.tsx
"use client";

import React, { useState, useEffect } from "react";
import { 
  Building2, 
  Plus, 
  Edit2, 
  Trash2, 
  Users, 
  Loader2,
  X,
  Save
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Department {
  id: string;
  name: string;
  description: string | null;
  doctors: Array<{
    id: string;
    user: {
      name: string;
      email: string;
    };
  }>;
  _count: {
    doctors: number;
  };
}

export default function DepartmentManagement() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: ""
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await fetch("/api/departments");
      if (response.ok) {
        const data = await response.json();
        setDepartments(data);
      }
    } catch (error) {
      toast.error("Failed to fetch departments");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch("/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success("Department created successfully");
        setIsAddModalOpen(false);
        setFormData({ name: "", description: "" });
        fetchDepartments();
      } else {
        const error = await response.text();
        toast.error(error || "Failed to create department");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDepartment) return;

    setSubmitting(true);

    try {
      const response = await fetch(`/api/departments/${selectedDepartment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success("Department updated successfully");
        setIsEditModalOpen(false);
        setSelectedDepartment(null);
        setFormData({ name: "", description: "" });
        fetchDepartments();
      } else {
        const error = await response.text();
        toast.error(error || "Failed to update department");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      const response = await fetch(`/api/departments/${id}`, {
        method: "DELETE"
      });

      if (response.ok) {
        toast.success("Department deleted successfully");
        fetchDepartments();
      } else {
        const error = await response.text();
        toast.error(error || "Failed to delete department");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const openEditModal = (department: Department) => {
    setSelectedDepartment(department);
    setFormData({
      name: department.name,
      description: department.description || ""
    });
    setIsEditModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-[#1E4A8A] dark:text-[#4A8AC8]" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-1.5 h-10 bg-[#1E4A8A] dark:bg-[#4A8AC8] rounded-full" />
          <div>
            <h2 className="text-3xl font-black text-[#1A2A4A] dark:text-[#E8EEF8] tracking-tighter">
              Department Management
            </h2>
            <p className="text-[#5A6E8A] dark:text-[#8A9CBA] font-medium">
              Organize doctors by departments
            </p>
          </div>
        </div>
        <Button
          onClick={() => {
            setFormData({ name: "", description: "" });
            setIsAddModalOpen(true);
          }}
          className="bg-[#1E4A8A] hover:bg-[#0F3A6A] dark:bg-[#4A8AC8] dark:hover:bg-[#1E4A8A] text-white rounded-2xl px-8 py-6 font-black shadow-xl"
        >
          <Plus size={20} className="mr-2" />
          Add Department
        </Button>
      </div>

      {/* Departments Grid */}
      {departments.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-[#111C3A] rounded-[2.5rem] border border-[#D0DCE8] dark:border-[#1A2A4A]">
          <Building2 size={48} className="mx-auto text-[#D0DCE8] dark:text-[#1A2A4A] mb-4" />
          <p className="text-[#5A6E8A] dark:text-[#8A9CBA] font-bold">
            No departments yet. Create your first department.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((dept) => (
            <div
              key={dept.id}
              className="bg-white dark:bg-[#111C3A] p-8 rounded-[2.5rem] border border-[#D0DCE8] dark:border-[#1A2A4A] hover:border-[#1E4A8A] dark:hover:border-[#4A8AC8] transition-all shadow-sm group"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="w-14 h-14 bg-[#1E4A8A]/10 dark:bg-[#4A8AC8]/10 rounded-2xl flex items-center justify-center text-[#1E4A8A] dark:text-[#4A8AC8] group-hover:scale-110 transition-transform">
                  <Building2 size={28} />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(dept)}
                    className="p-2 hover:bg-[#F0F4F8] dark:hover:bg-[#0A122A] rounded-xl transition-colors"
                  >
                    <Edit2 size={16} className="text-[#5A6E8A] dark:text-[#8A9CBA]" />
                  </button>
                  <button
                    onClick={() => handleDelete(dept.id, dept.name)}
                    className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                  >
                    <Trash2 size={16} className="text-red-500" />
                  </button>
                </div>
              </div>

              <h3 className="text-xl font-black text-[#1A2A4A] dark:text-[#E8EEF8] mb-2">
                {dept.name}
              </h3>
              
              {dept.description && (
                <p className="text-sm text-[#5A6E8A] dark:text-[#8A9CBA] mb-4 line-clamp-2">
                  {dept.description}
                </p>
              )}

              <div className="flex items-center gap-2 mt-6 pt-6 border-t border-[#F0F4F8] dark:border-[#0A122A]">
                <Users size={16} className="text-[#1E4A8A] dark:text-[#4A8AC8]" />
                <span className="text-sm font-bold text-[#1A2A4A] dark:text-[#E8EEF8]">
                  {dept._count.doctors} {dept._count.doctors === 1 ? "Doctor" : "Doctors"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Department Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="bg-white dark:bg-[#111C3A] border-[#D0DCE8] dark:border-[#1A2A4A] rounded-[2.5rem]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-[#1A2A4A] dark:text-[#E8EEF8]">
              Add New Department
            </DialogTitle>
            <DialogDescription className="text-[#5A6E8A] dark:text-[#8A9CBA]">
              Create a new department to organize your medical staff.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-6 mt-4">
            <div className="space-y-2">
              <Label className="text-[#1A2A4A] dark:text-[#E8EEF8] font-bold">
                Department Name *
              </Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Cardiology"
                required
                className="rounded-2xl h-12 bg-[#F0F4F8] dark:bg-[#0A122A] border-[#D0DCE8] dark:border-[#1A2A4A]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#1A2A4A] dark:text-[#E8EEF8] font-bold">
                Description (Optional)
              </Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the department..."
                rows={3}
                className="rounded-2xl bg-[#F0F4F8] dark:bg-[#0A122A] border-[#D0DCE8] dark:border-[#1A2A4A]"
              />
            </div>
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddModalOpen(false)}
                className="flex-1 rounded-2xl h-12"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-[#1E4A8A] hover:bg-[#0F3A6A] dark:bg-[#4A8AC8] dark:hover:bg-[#1E4A8A] text-white rounded-2xl h-12 font-black"
              >
                {submitting ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    <Save size={20} className="mr-2" />
                    Create Department
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Department Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="bg-white dark:bg-[#111C3A] border-[#D0DCE8] dark:border-[#1A2A4A] rounded-[2.5rem]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-[#1A2A4A] dark:text-[#E8EEF8]">
              Edit Department
            </DialogTitle>
            <DialogDescription className="text-[#5A6E8A] dark:text-[#8A9CBA]">
              Update department information.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-6 mt-4">
            <div className="space-y-2">
              <Label className="text-[#1A2A4A] dark:text-[#E8EEF8] font-bold">
                Department Name *
              </Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Cardiology"
                required
                className="rounded-2xl h-12 bg-[#F0F4F8] dark:bg-[#0A122A] border-[#D0DCE8] dark:border-[#1A2A4A]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#1A2A4A] dark:text-[#E8EEF8] font-bold">
                Description (Optional)
              </Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the department..."
                rows={3}
                className="rounded-2xl bg-[#F0F4F8] dark:bg-[#0A122A] border-[#D0DCE8] dark:border-[#1A2A4A]"
              />
            </div>
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
                className="flex-1 rounded-2xl h-12"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-[#1E4A8A] hover:bg-[#0F3A6A] dark:bg-[#4A8AC8] dark:hover:bg-[#1E4A8A] text-white rounded-2xl h-12 font-black"
              >
                {submitting ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    <Save size={20} className="mr-2" />
                    Update Department
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
