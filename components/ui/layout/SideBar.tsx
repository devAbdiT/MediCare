// components/layout/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Home, Calendar, Users, User, FileText } from "lucide-react";
import { signOut } from "@/lib/auth-client";

const menuItems: any = {
  admin: [
    { name: "Dashboard", href: "/dashboard/admin", icon: Home },
    { name: "Patients", href: "/dashboard/admin/patients", icon: Users },
    { name: "Doctors", href: "/dashboard/admin/doctors", icon: User },
    {
      name: "Appointments",
      href: "/dashboard/admin/appointments",
      icon: Calendar,
    },
  ],
  doctor: [
    { name: "Dashboard", href: "/dashboard/doctor", icon: Home },
    {
      name: "Appointments",
      href: "/dashboard/doctor/appointments",
      icon: Calendar,
    },
  ],
  receptionist: [
    { name: "Dashboard", href: "/dashboard/receptionist", icon: Home },
    {
      name: "Register Patient",
      href: "/dashboard/receptionist/register-patient",
      icon: User,
    },
    { name: "Patients", href: "/dashboard/receptionist/patients", icon: Users },
    {
      name: "Appointments",
      href: "/dashboard/receptionist/appointments",
      icon: Calendar,
    },
  ],
  patient: [
    { name: "Dashboard", href: "/dashboard/patient", icon: Home },
    {
      name: "Book Appointment",
      href: "/dashboard/patient/book-appointment",
      icon: Calendar,
    },
    {
      name: "My Appointments",
      href: "/dashboard/patient/appointments",
      icon: Calendar,
    },
    {
      name: "Medical Records",
      href: "/dashboard/patient/medical-records",
      icon: FileText,
    },
  ],
};

export default function Sidebar({ role }: { role: string }) {
  const pathname = usePathname();
  const items = menuItems[role] || [];

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b">
        <h2 className="text-2xl font-bold text-blue-600">MediCare</h2>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {items.map((item: any) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-blue-50 text-blue-600"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t">
        <button
          onClick={() => signOut()}
          className="flex w-full items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  );
}
