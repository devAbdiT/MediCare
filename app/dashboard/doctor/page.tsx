// app/dashboard/doctor/page.tsx
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";

export default async function DoctorDashboard() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session || session.user.role !== "DOCTOR") {
    redirect("/login");
  }

  return (
    <DashboardLayout role="doctor">
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Doctor Workspace</h1>
          <p className="text-slate-500 mt-2 text-lg">Welcome back, {session.user.name}</p>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
            <span className="w-2 h-8 bg-blue-600 rounded-full" />
            Today's Appointments
          </h2>
          
          <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <p className="text-slate-400 font-medium">No appointments scheduled for today yet.</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
