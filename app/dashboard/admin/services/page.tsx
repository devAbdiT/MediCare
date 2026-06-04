"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Plus, Edit2, Trash2, Loader2, ToggleLeft, ToggleRight, ClipboardList, Info } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ServiceCategory } from "@prisma/client";

interface Service {
  id: string;
  name: string;
  code: string;
  category: ServiceCategory;
  unitPrice: number | string;
  isActive: boolean;
  description: string | null;
  createdAt: string;
}

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const [formData, setFormData] = useState<{
    name: string;
    code: string;
    category: ServiceCategory;
    unitPrice: string;
    description: string;
  }>({
    name: "",
    code: "",
    category: ServiceCategory.CONSULTATION,
    unitPrice: "",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchServices = async () => {
    try {
      const res = await fetch("/api/services");
      if (res.ok) {
        const data = await res.json();
        setServices(data);
      } else {
        toast.error("Failed to load services");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to connect to the server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const url = editingService ? `/api/services/${editingService.id}` : "/api/services";
      const method = editingService ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          code: formData.code.toUpperCase(),
          category: formData.category,
          unitPrice: parseFloat(formData.unitPrice),
          description: formData.description || null,
        }),
      });

      if (res.ok) {
        toast.success(editingService ? "Service updated successfully" : "Service created successfully");
        setIsDialogOpen(false);
        setEditingService(null);
        setFormData({
          name: "",
          code: "",
          category: ServiceCategory.CONSULTATION,
          unitPrice: "",
          description: "",
        });
        fetchServices();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to save service");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while saving");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (service: Service) => {
    try {
      const res = await fetch(`/api/services/${service.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !service.isActive }),
      });

      if (res.ok) {
        toast.success(`Service is now ${!service.isActive ? "Active" : "Inactive"}`);
        fetchServices();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update status");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    }
  };

  const handleDelete = async (service: Service) => {
    if (!confirm(`Are you sure you want to delete the service: ${service.name} (${service.code})?`)) return;

    try {
      const res = await fetch(`/api/services/${service.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Service deactivated (soft-deleted)");
        fetchServices();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete service");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    }
  };

  const openAddDialog = () => {
    setEditingService(null);
    setFormData({
      name: "",
      code: "",
      category: ServiceCategory.CONSULTATION,
      unitPrice: "",
      description: "",
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      code: service.code,
      category: service.category,
      unitPrice: service.unitPrice.toString(),
      description: service.description || "",
    });
    setIsDialogOpen(true);
  };

  const getCategoryBadgeClass = (category: ServiceCategory) => {
    switch (category) {
      case "CONSULTATION":
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/60";
      case "LAB":
        return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900/60";
      case "PHARMACY":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/60";
      case "PROCEDURE":
        return "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-900/60";
      case "ROOM":
        return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/60";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/40 dark:text-slate-400 dark:border-slate-800";
    }
  };

  const formatCategoryText = (category: string) => {
    return category.charAt(0) + category.slice(1).toLowerCase();
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8 pb-12 max-w-7xl mx-auto">
        
        {/* Header section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-[#111C3A] p-8 rounded-[2.5rem] border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-sm transition-colors duration-500">
          <div>
            <h1 className="text-4xl font-black text-[#1A2A4A] dark:text-[#E8EEF8] tracking-tight flex items-center gap-3">
              <ClipboardList className="text-[#1E4A8A] dark:text-[#4A8AC8]" size={36} />
              Service Catalogue
            </h1>
            <p className="text-[#5A6E8A] dark:text-[#8A9CBA] mt-2 font-medium">
              Configure services, medical procedures, consultations, and prices.
            </p>
          </div>

          <button
            onClick={openAddDialog}
            className="flex items-center gap-2 px-6 py-4 bg-[#1E4A8A] hover:bg-[#0F3A6A] text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-lg shadow-[#1E4A8A]/20 active:scale-95"
          >
            <Plus size={18} />
            Add Service
          </button>
        </div>

        {/* Info Box */}
        <div className="flex gap-4 p-6 bg-blue-50/50 dark:bg-[#1E4A8A]/10 rounded-2xl border border-blue-100 dark:border-blue-900/40 text-sm text-blue-800 dark:text-blue-300">
          <Info className="shrink-0 mt-0.5" size={20} />
          <div>
            <p className="font-bold">System Configuration Notice</p>
            <p className="mt-1 font-medium opacity-90">
              The services created here populate the billing system, pharmacy dispensary, and lab testing registers. Deactivating a service prevents it from being ordered or billed going forward, but preserves historical data.
            </p>
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin text-[#1E4A8A] dark:text-[#4A8AC8]" size={40} />
          </div>
        ) : (
          <div className="bg-white dark:bg-[#111C3A] rounded-[2.5rem] border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-sm overflow-hidden transition-colors duration-500">
            <Table>
              <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
                <TableRow className="border-b border-[#D0DCE8] dark:border-[#1A2A4A]">
                  <TableHead className="font-black text-[#1A2A4A] dark:text-[#E8EEF8] p-6">Code</TableHead>
                  <TableHead className="font-black text-[#1A2A4A] dark:text-[#E8EEF8] p-6">Name</TableHead>
                  <TableHead className="font-black text-[#1A2A4A] dark:text-[#E8EEF8] p-6">Category</TableHead>
                  <TableHead className="font-black text-[#1A2A4A] dark:text-[#E8EEF8] p-6 text-right">Unit Price (ETB)</TableHead>
                  <TableHead className="font-black text-[#1A2A4A] dark:text-[#E8EEF8] p-6 text-center">Status</TableHead>
                  <TableHead className="font-black text-[#1A2A4A] dark:text-[#E8EEF8] p-6 text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-16 text-[#5A6E8A] dark:text-[#8A9CBA] font-bold italic">
                      No services configured in the catalogue. Click "Add Service" to create one.
                    </TableCell>
                  </TableRow>
                ) : (
                  services.map((service) => (
                    <TableRow
                      key={service.id}
                      className="border-b border-[#D0DCE8]/60 dark:border-[#1A2A4A]/60 hover:bg-[#F8FAFC]/50 dark:hover:bg-[#1E293B]/20 transition-colors"
                    >
                      <TableCell className="p-6 font-mono font-bold text-[#1E4A8A] dark:text-[#4A8AC8]">{service.code}</TableCell>
                      <TableCell className="p-6">
                        <div>
                          <p className="font-black text-[#1A2A4A] dark:text-[#E8EEF8]">{service.name}</p>
                          {service.description && (
                            <p className="text-xs text-[#5A6E8A] dark:text-[#8A9CBA] font-medium mt-1 max-w-md truncate">
                              {service.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="p-6">
                        <Badge className={`px-2.5 py-1 rounded-lg border font-black text-[10px] uppercase tracking-wider ${getCategoryBadgeClass(service.category)}`}>
                          {formatCategoryText(service.category)}
                        </Badge>
                      </TableCell>
                      <TableCell className="p-6 text-right font-black text-[#1A2A4A] dark:text-[#E8EEF8]">
                        {Number(service.unitPrice).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell className="p-6 text-center">
                        <Badge
                          className={`px-2.5 py-1 rounded-lg font-black text-[10px] uppercase tracking-wider ${
                            service.isActive
                              ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                              : "bg-slate-500/10 text-slate-500 border border-slate-500/20"
                          }`}
                        >
                          {service.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="p-6">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditDialog(service)}
                            className="p-2.5 text-[#5A6E8A] hover:bg-[#F0F4F8] dark:hover:bg-[#0A122A] rounded-xl transition-all"
                            title="Edit Service"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(service)}
                            className={`p-2.5 rounded-xl transition-all ${
                              service.isActive
                                ? "text-[#5A6E8A] hover:bg-[#F0F4F8] dark:hover:bg-[#0A122A]"
                                : "text-emerald-500 hover:bg-emerald-500/10"
                            }`}
                            title={service.isActive ? "Deactivate" : "Activate"}
                          >
                            {service.isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                          </button>
                          <button
                            onClick={() => handleDelete(service)}
                            className="p-2.5 text-[#D94A5A] hover:bg-[#D94A5A]/10 rounded-xl transition-all"
                            title="Delete Service"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Dialog Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-white dark:bg-[#111C3A] border-none rounded-[2rem] max-w-lg p-8 shadow-2xl transition-colors duration-500">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-[#1A2A4A] dark:text-white tracking-tight">
              {editingService ? "Edit Service" : "Add Service to Catalogue"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-widest block">
                  Service Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-4 bg-[#F0F4F8] dark:bg-[#0A122A] rounded-2xl border border-transparent focus:border-[#1E4A8A] dark:focus:border-[#4A8AC8] outline-none font-bold text-[#1A2A4A] dark:text-white"
                  placeholder="e.g. Consult Fee"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-widest block">
                  Service Code
                </label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full p-4 bg-[#F0F4F8] dark:bg-[#0A122A] rounded-2xl border border-transparent focus:border-[#1E4A8A] dark:focus:border-[#4A8AC8] outline-none font-bold text-[#1A2A4A] dark:text-white font-mono"
                  placeholder="e.g. SRV-CONS"
                  disabled={editingService !== null}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-widest block">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as ServiceCategory })}
                  className="w-full p-4 bg-[#F0F4F8] dark:bg-[#0A122A] rounded-2xl border border-transparent focus:border-[#1E4A8A] dark:focus:border-[#4A8AC8] outline-none font-bold text-[#1A2A4A] dark:text-white"
                >
                  {Object.values(ServiceCategory).map((cat) => (
                    <option key={cat} value={cat}>
                      {formatCategoryText(cat)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-widest block">
                  Unit Price (ETB)
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0"
                  value={formData.unitPrice}
                  onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                  className="w-full p-4 bg-[#F0F4F8] dark:bg-[#0A122A] rounded-2xl border border-transparent focus:border-[#1E4A8A] dark:focus:border-[#4A8AC8] outline-none font-bold text-[#1A2A4A] dark:text-white"
                  placeholder="e.g. 200.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-widest block">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-4 bg-[#F0F4F8] dark:bg-[#0A122A] rounded-2xl border border-transparent focus:border-[#1E4A8A] dark:focus:border-[#4A8AC8] outline-none font-bold text-[#1A2A4A] dark:text-white resize-none"
                placeholder="Details about what is covered in this service..."
                rows={3}
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-[#1E4A8A] hover:bg-[#0F3A6A] text-white rounded-2xl font-black uppercase tracking-widest transition-all flex justify-center items-center gap-2 active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : editingService ? (
                  "Save Changes"
                ) : (
                  "Create Service"
                )}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
