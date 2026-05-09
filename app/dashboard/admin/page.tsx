// app/dashboard/admin/page.tsx
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import prisma from "@/lib/prisma";

export default async function AdminDashboard() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  // Get real counts
  const [patientCount, appointmentTodayCount, doctorCount, userCount] = await Promise.all([
    prisma.patient.count(),
    prisma.appointment.count({
      where: {
        dateTime: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lt: new Date(new Date().setHours(23, 59, 59, 999)),
        }
      }
    }),
    prisma.doctor.count(),
    prisma.user.count()
  ]);

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Admin Console</h1>
            <p className="text-slate-500 mt-2 text-lg font-medium">System Health & Overview</p>
          </div>
          <div className="bg-emerald-500 text-white px-6 py-2 rounded-2xl text-sm font-black shadow-lg shadow-emerald-100 flex items-center gap-2">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
            SYSTEM OPERATIONAL
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Patients" value={patientCount.toString()} trend="Registered in system" />
          <StatCard title="Today's Visits" value={appointmentTodayCount.toString()} trend="Scheduled appointments" />
          <StatCard title="Medical Staff" value={doctorCount.toString()} trend="Active doctors" />
          <StatCard title="System Users" value={userCount.toString()} trend="Across all roles" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <span className="w-2 h-8 bg-blue-600 rounded-full" />
              Quick Management
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <QuickLink name="Manage Users" href="/dashboard/admin/users" color="bg-blue-50 text-blue-600" />
              <QuickLink name="View Schedule" href="/dashboard/admin/appointments" color="bg-purple-50 text-purple-600" />
              <QuickLink name="System Logs" href="#" color="bg-slate-50 text-slate-600" />
              <QuickLink name="Audit Trail" href="#" color="bg-orange-50 text-orange-600" />
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <span className="w-2 h-8 bg-emerald-500 rounded-full" />
              Recent Activity
            </h2>
            <div className="space-y-4">
              <ActivityItem text="New patient registered: John Doe" time="2 mins ago" />
              <ActivityItem text="Dr. Alex confirmed an appointment" time="15 mins ago" />
              <ActivityItem text="System backup completed" time="1 hour ago" />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ title, value, trend }: { title: string; value: string; trend: string }) {
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 group hover:border-blue-200 transition-all">
      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">{title}</h3>
      <p className="text-4xl font-black text-slate-900 mt-2">{value}</p>
      <p className="text-xs text-blue-500 font-bold mt-2 bg-blue-50 inline-block px-2 py-1 rounded-lg">
        {trend}
      </p>
    </div>
  );
}

function QuickLink({ name, href, color }: { name: string; href: string; color: string }) {
  return (
    <a href={href} className={`${color} p-4 rounded-2xl font-bold text-center hover:scale-[1.02] transition-transform active:scale-95`}>
      {name}
    </a>
  );
}

function ActivityItem({ text, time }: { text: string; time: string }) {
  return (
    <div className="flex justify-between items-center p-3 rounded-xl hover:bg-slate-50 transition-colors">
      <span className="text-slate-600 font-medium text-sm">{text}</span>
      <span className="text-slate-400 text-xs font-bold whitespace-nowrap ml-4">{time}</span>
    </div>
  );
}
