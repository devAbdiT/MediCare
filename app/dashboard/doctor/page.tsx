// app/dashboard/doctor/page.tsx
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import prisma from "@/lib/prisma";
import { format } from "date-fns";
import { Calendar, Clock, User, ExternalLink, BadgeCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default async function DoctorDashboard() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session || session.user.role !== "DOCTOR") {
    redirect("/login");
  }

  // Get doctor record
  const doctor = await prisma.doctor.findUnique({
    where: { userId: session.user.id }
  });

  // Get today's appointments for this doctor
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const appointments = await prisma.appointment.findMany({
    where: {
      doctorId: doctor?.id,
      dateTime: {
        gte: today,
        lt: tomorrow,
      },
      status: { not: "CANCELLED" }
    },
    include: {
      patient: {
        include: {
          user: { select: { name: true, phone: true } }
        }
      }
    },
    orderBy: { dateTime: "asc" }
  });

  return (
    <DashboardLayout role="doctor">
      <div className="space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Doctor Workspace</h1>
            <p className="text-slate-500 mt-2 text-lg">You have {appointments.length} appointments today.</p>
          </div>
          <div className="text-right hidden md:block">
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Current Date</p>
            <p className="text-slate-900 font-black text-xl">{format(new Date(), "MMMM dd, yyyy")}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Schedule */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-4">
              <Clock className="text-blue-600" size={24} />
              Today's Schedule
            </h2>

            {appointments.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-100">
                <p className="text-slate-400 font-medium italic">No appointments for today.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {appointments.map((appt) => (
                  <div key={appt.id} className="bg-white p-6 rounded-3xl border border-slate-100 flex items-center justify-between hover:shadow-lg hover:shadow-slate-100 transition-all group">
                    <div className="flex items-center gap-6">
                      <div className="bg-blue-50 text-blue-700 font-black px-4 py-3 rounded-2xl text-center min-w-[100px]">
                        {format(appt.dateTime, "HH:mm")}
                      </div>
                      <div>
                        <h4 className="font-bold text-lg text-slate-900">{appt.patient.user.name}</h4>
                        <p className="text-sm text-slate-500 font-medium flex items-center gap-2">
                          <User size={14} />
                          {appt.patient.user.phone}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={appt.status === "SCHEDULED" ? "default" : "outline"} className="rounded-lg px-3 py-1 font-bold">
                        {appt.status}
                      </Badge>
                      <Link href={`/dashboard/doctor/appointments/${appt.id}`}>
                        <button className="p-3 bg-slate-50 text-slate-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all">
                          <ExternalLink size={18} />
                        </button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stats & Tools */}
          <div className="space-y-6">
            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-slate-200">
              <div className="flex justify-between items-start mb-6">
                <BadgeCheck className="text-blue-400" size={32} />
                <span className="bg-white/10 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">Active Shift</span>
              </div>
              <h3 className="text-2xl font-black mb-2">My Specialization</h3>
              <p className="text-blue-300 font-bold text-lg">{doctor?.specialization}</p>
              
              <div className="mt-8 pt-8 border-t border-white/10 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Completed</p>
                  <p className="text-2xl font-black">0</p>
                </div>
                <div>
                  <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Remaining</p>
                  <p className="text-2xl font-black">{appointments.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full text-left px-4 py-3 rounded-xl bg-slate-50 text-slate-600 font-bold text-sm hover:bg-blue-50 hover:text-blue-600 transition-all">
                  Search Patient History
                </button>
                <button className="w-full text-left px-4 py-3 rounded-xl bg-slate-50 text-slate-600 font-bold text-sm hover:bg-blue-50 hover:text-blue-600 transition-all">
                  Access Drug Database
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
