// app/dashboard/receptionist/page.tsx
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";

export default async function ReceptionistDashboard() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session || session.user.role !== "RECEPTIONIST") {
    redirect("/login");
  }

  return (
    <DashboardLayout role="receptionist">
      <div className="space-y-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Reception Desk</h1>
            <p className="text-slate-500 mt-2 text-lg">Managing patient flow & appointments</p>
          </div>
          <button className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">
            + New Patient
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 md:col-span-2">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Patient Check-in</h2>
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl text-slate-400 text-center italic">
                Ready to manage appointments...
              </div>
            </div>
          </div>
          
          <div className="bg-blue-600 p-8 rounded-3xl shadow-xl text-white">
            <h2 className="text-xl font-bold mb-4">Quick Stats</h2>
            <div className="space-y-6">
              <div>
                <p className="text-blue-200 text-sm font-bold uppercase tracking-widest">Waiting Room</p>
                <p className="text-4xl font-black">0</p>
              </div>
              <div>
                <p className="text-blue-200 text-sm font-bold uppercase tracking-widest">Confirmed Today</p>
                <p className="text-4xl font-black">0</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
