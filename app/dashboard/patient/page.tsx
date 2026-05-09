// app/dashboard/patient/page.tsx
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";

export default async function PatientDashboard() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session || session.user.role !== "PATIENT") {
    redirect("/login");
  }

  return (
    <DashboardLayout role="patient">
      <div className="space-y-8">
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-10 rounded-[2.5rem] text-white shadow-xl shadow-blue-100 relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-4xl font-black tracking-tight">Healthy morning, {session.user.name.split(' ')[0]}!</h1>
            <p className="text-blue-100 mt-2 text-lg font-medium">Your health journey is our priority. How are you feeling today?</p>
            <button className="mt-8 bg-white text-blue-600 px-8 py-4 rounded-2xl font-black shadow-lg hover:bg-slate-50 transition-all flex items-center gap-2">
              Book New Appointment
            </button>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              Upcoming Appointments
            </h2>
            <div className="text-center py-12 text-slate-400 font-medium italic border-2 border-dashed border-slate-100 rounded-3xl">
              No upcoming appointments.
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100">
              <h3 className="text-emerald-800 font-bold mb-2 uppercase tracking-widest text-xs">Latest Record</h3>
              <p className="text-emerald-900 font-black text-xl">Check-up Result</p>
              <p className="text-emerald-700 text-sm mt-1 font-medium italic">Pending review...</p>
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
