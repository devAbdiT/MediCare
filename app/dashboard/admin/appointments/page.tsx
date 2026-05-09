// app/dashboard/admin/appointments/page.tsx
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import prisma from "@/lib/prisma";
import { format } from "date-fns";
import { Calendar, Clock, Stethoscope, User, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default async function AdminAppointmentsPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const appointments = await prisma.appointment.findMany({
    orderBy: { dateTime: "desc" },
    include: {
      patient: {
        include: { user: { select: { name: true } } }
      },
      doctor: {
        include: { user: { select: { name: true } } }
      }
    }
  });

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Master Schedule</h1>
          <p className="text-slate-500 mt-2 font-medium">Overview of all clinic appointments</p>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                  <th className="px-8 py-6">Date & Time</th>
                  <th className="px-8 py-6">Patient</th>
                  <th className="px-8 py-6">Assigned Doctor</th>
                  <th className="px-8 py-6">Status</th>
                  <th className="px-8 py-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {appointments.map((appt) => (
                  <tr key={appt.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex flex-col items-center justify-center text-blue-600 font-bold group-hover:bg-blue-600 group-hover:text-white transition-all">
                          <span className="text-[10px] uppercase leading-none">{format(new Date(appt.dateTime), "MMM")}</span>
                          <span className="text-lg leading-none">{format(new Date(appt.dateTime), "dd")}</span>
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 flex items-center gap-2">
                            <Clock size={14} className="text-slate-400" />
                            {format(new Date(appt.dateTime), "HH:mm")}
                          </p>
                          <p className="text-xs text-slate-400 font-medium">Visit ID: {appt.id.slice(-6).toUpperCase()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                          <User size={14} />
                        </div>
                        <span className="font-bold text-slate-700">{appt.patient.user.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                          <Stethoscope size={14} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-700">Dr. {appt.doctor.user.name}</p>
                          <p className="text-[10px] text-blue-500 font-bold uppercase tracking-wider">{appt.doctor.specialization}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <Badge variant={appt.status === "SCHEDULED" ? "default" : "outline"} className="rounded-lg px-3 py-1 font-bold">
                        {appt.status}
                      </Badge>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button className="text-sm font-black text-blue-600 hover:text-blue-800 underline underline-offset-4">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
