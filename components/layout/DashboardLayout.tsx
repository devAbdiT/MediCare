// components/layout/DashboardLayout.tsx
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { 
  LayoutDashboard, 
  UserCircle, 
  Calendar, 
  Users, 
  LogOut, 
  Stethoscope,
  ClipboardList,
  Search
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: "admin" | "doctor" | "receptionist" | "patient";
}

export default function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const router = useRouter();
  const { data: session } = authClient.useSession();

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/login");
  };

  const menuItems = {
    admin: [
      { name: "Overview", icon: LayoutDashboard, href: "/dashboard/admin" },
      { name: "All Users", icon: Users, href: "/dashboard/admin/users" },
      { name: "All Appointments", icon: Calendar, href: "/dashboard/admin/appointments" },
    ],
    doctor: [
      { name: "My Schedule", icon: Calendar, href: "/dashboard/doctor" },
      { name: "Patients", icon: Users, href: "/dashboard/doctor/patients" },
    ],
    receptionist: [
      { name: "Schedule", icon: Calendar, href: "/dashboard/receptionist" },
      { name: "Register Patient", icon: UserCircle, href: "/dashboard/receptionist/register" },
      { name: "Search", icon: Search, href: "/dashboard/receptionist/search" },
    ],
    patient: [
      { name: "My Health", icon: ClipboardList, href: "/dashboard/patient" },
      { name: "Book Visit", icon: Calendar, href: "/dashboard/patient/book" },
      { name: "Profile", icon: UserCircle, href: "/dashboard/patient/profile" },
    ],
  };

  const currentMenu = menuItems[role];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r flex flex-col sticky top-0 h-screen">
        <div className="p-6">
          <div className="flex items-center gap-2 text-blue-600 font-bold text-xl">
            <Stethoscope size={28} />
            <span>MediCare</span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {currentMenu.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all group"
            >
              <item.icon size={20} className="group-hover:scale-110 transition-transform" />
              <span className="font-medium">{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t space-y-4">
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
              {session?.user?.name?.[0] || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{session?.user?.name}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wider">{role}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all"
          >
            <LogOut size={20} />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
