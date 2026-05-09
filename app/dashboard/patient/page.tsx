// app/dashboard/patient/page.tsx
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { format } from "date-fns";

export default async function PatientDashboard() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session || session.user.role !== "PATIENT") {
    redirect("/login");
  }

  const patient = await prisma.patient.findUnique({
    where: { userId: session.user.id }
  });

  const appointments = await prisma.appointment.findMany({
    where: {
      patientId: patient?.id,
      dateTime: { gte: new Date() },
      status: "SCHEDULED"
    },
    include: {
      doctor: { include: { user: { select: { name: true } } } }
    },
    orderBy: { dateTime: "asc" }
  });

  const latestRecord = await prisma.medicalRecord.findFirst({
    where: { patientId: patient?.id },
    orderBy: { date: "desc" }
  });

  return (
    <DashboardLayout role="patient">
      <div className="space-y-8">
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-10 rounded-[2.5rem] text-white shadow-xl shadow-blue-100 relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-4xl font-black tracking-tight flex items-center gap-4">
              Healthy morning, {session.user.name.split(' ')[0]}!
            </h1>
            <p className="text-blue-100 mt-2 text-lg font-medium opacity-90">Your health journey is our priority. How are you feeling today?</p>
            <Link href="/dashboard/patient/book">
              <button className="mt-8 bg-white text-blue-600 px-8 py-4 rounded-2xl font-black shadow-lg hover:bg-slate-50 active:scale-95 transition-all flex items-center gap-2">
                Book New Appointment
              </button>
            </Link>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              Upcoming Appointments
            </h2>
            
            {appointments.length === 0 ? (
              <div className="text-center py-12 text-slate-400 font-medium italic border-2 border-dashed border-slate-100 rounded-3xl">
                No upcoming appointments.
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map((appt) => (
                  <div key={appt.id} className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-6">
                      <div className="bg-white p-4 rounded-2xl shadow-sm text-center min-w-[90px]">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{format(appt.dateTime, "MMM")}</p>
                        <p className="text-2xl font-black text-blue-600 leading-none my-1">{format(appt.dateTime, "dd")}</p>
                        <p className="text-xs font-bold text-slate-600">{format(appt.dateTime, "HH:mm")}</p>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Doctor</p>
                        <h4 className="text-lg font-black text-slate-900">Dr. {appt.doctor.user.name}</h4>
                        <p className="text-xs font-bold text-blue-500">{appt.doctor.specialization}</p>
                      </div>
                    </div>
                    <button className="px-6 py-3 bg-white text-red-500 border border-red-50 rounded-xl font-bold text-sm hover:bg-red-50 transition-all">
                      Cancel Visit
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-emerald-50 p-8 rounded-[2rem] border border-emerald-100 shadow-sm shadow-emerald-50">
              <h3 className="text-emerald-800 font-black mb-4 uppercase tracking-widest text-[10px]">Latest Health Record</h3>
              {latestRecord ? (
                <div>
                  <p className="text-emerald-900 font-black text-2xl mb-1">{latestRecord.diagnosis}</p>
                  <p className="text-emerald-600 text-sm font-bold mb-6">{format(latestRecord.date, "MMMM dd, yyyy")}</p>
                  <Link href="/dashboard/patient/records">
                    <button className="text-emerald-800 text-xs font-black uppercase tracking-widest border-b-2 border-emerald-200 pb-1 hover:border-emerald-500 transition-all">
                      View Full Record
                    </button>
                  </Link>
                </div>
              ) : (
                <p className="text-emerald-700 text-sm font-medium italic">No clinical records found.</p>
              )}
            </div>
            
            <div className="bg-slate-900 p-8 rounded-[2rem] text-white shadow-xl">
              <h3 className="font-bold text-xl mb-4">Patient ID</h3>
              <div className="p-4 bg-white/10 rounded-2xl font-mono text-center tracking-widest text-lg">
                #PAT-{session.user.id.slice(-6).toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
