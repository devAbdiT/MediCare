// app/dashboard/receptionist/page.tsx
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import prisma from "@/lib/prisma";
import { format } from "date-fns";
import { Calendar, User, Clock, CheckCircle2, ChevronRight, UserPlus } from "lucide-react";
import Link from "next/link";

export default async function ReceptionistDashboard() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session || session.user.role !== "RECEPTIONIST") {
    redirect("/login");
  }

  // Get today's total clinic schedule
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const appointments = await prisma.appointment.findMany({
    where: {
      dateTime: { gte: today, lt: tomorrow },
      status: { not: "CANCELLED" }
    },
    include: {
      patient: { include: { user: { select: { name: true } } } },
      doctor: { include: { user: { select: { name: true } } } },
    },
    orderBy: { dateTime: "asc" }
  });

  const patientCount = await prisma.patient.count();

  return (
    <DashboardLayout role="receptionist">
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Reception Overview</h1>
            <p className="text-slate-500 mt-2 text-lg">Managing {appointments.length} appointments scheduled for today.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/dashboard/receptionist/register">
              <button className="bg-blue-600 text-white px-6 py-4 rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-2">
                <UserPlus size={20} />
                Register Patient
              </button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
              <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                Today's Clinic Schedule
              </h2>

              {appointments.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-100">
                  <p className="text-slate-400 font-medium">No appointments booked for today.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {appointments.map((appt) => (
                    <div key={appt.id} className="p-5 rounded-3xl bg-slate-50/50 border border-slate-100 flex items-center justify-between hover:bg-white hover:shadow-xl hover:shadow-slate-100 transition-all">
                      <div className="flex items-center gap-5">
                        <div className="bg-white p-3 rounded-2xl shadow-sm text-center min-w-[70px]">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Time</p>
                          <p className="text-sm font-black text-blue-600">{format(appt.dateTime, "HH:mm")}</p>
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{appt.patient.user.name}</p>
                          <p className="text-xs text-slate-500 font-medium italic">with Dr. {appt.doctor.user.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="hidden md:block text-right px-4 border-r border-slate-200">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Status</p>
                          <p className="text-xs font-bold text-emerald-600">CONFIRMED</p>
                        </div>
                        <button className="p-3 bg-white text-slate-400 rounded-xl hover:text-blue-600 transition-colors">
                          <ChevronRight size={20} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Stats Bar */}
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-6">Clinic Statistics</h3>
              <div className="space-y-6">
                <StatItem label="Total Registered Patients" value={patientCount.toString()} icon={<User className="text-blue-600" />} />
                <StatItem label="Today's Capacity" value="65%" icon={<CheckCircle2 className="text-emerald-500" />} />
              </div>
            </div>

            <div className="bg-blue-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-blue-100">
              <h3 className="font-bold text-lg mb-2">Need Help?</h3>
              <p className="text-blue-100 text-sm mb-6 font-medium">Access the hospital internal directory for support.</p>
              <button className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl font-bold transition-all">
                Internal Contacts
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatItem({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4">
      <div className="p-3 bg-slate-50 rounded-2xl">
        {icon}
      </div>
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-black text-slate-900">{value}</p>
      </div>
    </div>
  );
}
