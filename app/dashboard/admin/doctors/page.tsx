// app/dashboard/admin/doctors/page.tsx
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import prisma from "@/lib/prisma";
import { Stethoscope, User, GraduationCap, Clock, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default async function AdminDoctorsPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const doctors = await prisma.doctor.findMany({
    include: {
      user: { select: { name: true, email: true, phone: true } },
      _count: { select: { appointments: true } }
    }
  });

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Medical Staff</h1>
          <p className="text-slate-500 mt-2 font-medium">Overview of specialized doctors and their performance</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {doctors.map((doctor) => (
            <div key={doctor.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 hover:shadow-xl hover:shadow-blue-200/20 transition-all group overflow-hidden relative">
              {/* Decorative background icon */}
              <Stethoscope size={120} className="absolute -bottom-4 -right-4 text-slate-50 opacity-50 group-hover:text-blue-50 transition-colors -z-0" />
              
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                    <User size={32} />
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold">Available</Badge>
                </div>

                <h3 className="text-2xl font-black text-slate-900 mb-1">Dr. {doctor.user.name}</h3>
                <p className="text-blue-600 font-bold text-sm uppercase tracking-widest mb-6">{doctor.specialization}</p>

                <div className="space-y-4 pt-6 border-t border-slate-50">
                  <div className="flex items-center gap-3 text-slate-500 font-medium text-sm">
                    <GraduationCap size={18} className="text-slate-400" />
                    <span>Specialist in {doctor.specialization}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500 font-medium text-sm">
                    <Award size={18} className="text-slate-400" />
                    <span>{doctor._count.appointments} Total Consultations</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500 font-medium text-sm">
                    <Clock size={18} className="text-slate-400" />
                    <span>Full-time Availability</span>
                  </div>
                </div>

                <button className="w-full mt-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-slate-800 transition-all">
                  View Performance Report
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
