// app/dashboard/doctor/referrals/page.tsx
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ReferralsClient from "./ReferralsClient";

export default async function ReferralsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || (session.user as any).role !== "DOCTOR") redirect("/login");

  const doctor = await prisma.doctor.findUnique({ where: { userId: session.user.id } });
  if (!doctor) redirect("/dashboard");

  return (
    <DashboardLayout role="doctor">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-black text-[#1A2A4A] dark:text-[#E8EEF8] tracking-tight">Referrals</h1>
          <p className="text-[#5A6E8A] dark:text-[#8A9CBA] font-medium">Manage incoming and outgoing patient referrals.</p>
        </div>
        
        <ReferralsClient doctorId={doctor.id} departmentId={doctor.departmentId} />
      </div>
    </DashboardLayout>
  );
}
