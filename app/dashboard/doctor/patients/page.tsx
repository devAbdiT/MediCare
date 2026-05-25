// app/dashboard/doctor/patients/page.tsx
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import prisma from "@/lib/prisma";
import { Users } from "lucide-react";
import PatientsListClient from "./PatientsListClient";

export default async function DoctorPatientsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || (session.user as any).role !== "DOCTOR") {
    redirect("/login");
  }

  const doctor = await prisma.doctor.findUnique({
    where: { userId: session.user.id },
  });

  if (!doctor) {
    redirect("/login");
  }

  // Fetch ONLY patients that this doctor has appointments with
  const appointments = await prisma.appointment.findMany({
    where: {
      doctorId: doctor.id,
      status: { in: ["COMPLETED", "SCHEDULED", "RESCHEDULED"] },
    },
    include: {
      patient: {
        include: {
          user: {
            select: { name: true, email: true, phone: true },
          },
        },
      },
    },
    orderBy: { dateTime: "desc" },
  });

  // Deduplicate patients and compute stats
  const patientMap = new Map<
    string,
    {
      id: string;
      cardNumber: string | null;
      user: { name: string; email: string; phone: string | null };
      appointmentCount: number;
      lastVisit: string | null;
    }
  >();

  for (const appt of appointments) {
    const p = appt.patient;
    const existing = patientMap.get(p.id);

    if (existing) {
      existing.appointmentCount += 1;
      // Keep the most recent visit date
      if (!existing.lastVisit || new Date(appt.dateTime) > new Date(existing.lastVisit)) {
        existing.lastVisit = appt.dateTime.toISOString();
      }
    } else {
      patientMap.set(p.id, {
        id: p.id,
        cardNumber: p.cardNumber,
        user: p.user,
        appointmentCount: 1,
        lastVisit: appt.dateTime.toISOString(),
      });
    }
  }

  const patients = Array.from(patientMap.values()).sort((a, b) => {
    if (!a.lastVisit || !b.lastVisit) return 0;
    return new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime();
  });

  return (
    <DashboardLayout role="doctor">
      <div className="max-w-5xl mx-auto space-y-8 pb-12">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-8 bg-[#1E4A8A] dark:bg-[#4A8AC8] rounded-full" />
            <h1 className="text-4xl font-black text-[#1A2A4A] dark:text-[#E8EEF8] tracking-tight">
              My Patients
            </h1>
          </div>
          <p className="text-[#5A6E8A] dark:text-[#8A9CBA] mt-2 text-lg font-medium">
            Patients you have scheduled or completed appointments with.
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 px-5 py-3 bg-[#F0F4F8] dark:bg-[#0A122A] rounded-2xl border border-[#D0DCE8] dark:border-[#1A2A4A]">
            <Users size={18} className="text-[#1E4A8A] dark:text-[#4A8AC8]" />
            <span className="text-sm font-black text-[#1A2A4A] dark:text-[#E8EEF8]">
              {patients.length} Patient{patients.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Patient List with Records Modal */}
        <div className="bg-white dark:bg-[#111C3A] p-8 rounded-[2.5rem] border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-sm transition-colors duration-500">
          <PatientsListClient patients={patients} />
        </div>
      </div>
    </DashboardLayout>
  );
}
