// components/layout/DashboardLayout.tsx
"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import {
  LayoutDashboard,
  UserCircle,
  Calendar,
  Users,
  LogOut,
  Stethoscope,
  ClipboardList,
  Search,
  Settings,
  Bell,
  Sun,
  Moon,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: "admin" | "doctor" | "receptionist" | "patient";
}

export default function DashboardLayout({
  children,
  role,
}: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = authClient.useSession();
  const { theme, setTheme } = useTheme();

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/login");
  };

  const menuItems = {
    admin: [
      { name: "Overview", icon: LayoutDashboard, href: "/dashboard/admin" },
      { name: "Patients", icon: Users, href: "/dashboard/admin/patients" },
      { name: "Doctors", icon: Stethoscope, href: "/dashboard/admin/doctors" },
      {
        name: "Receptionists",
        icon: Users,
        href: "/dashboard/admin/receptionists",
      },
      {
        name: "Departments",
        icon: ClipboardList,
        href: "/dashboard/admin/departments",
      },
      {
        name: "Appointments",
        icon: Calendar,
        href: "/dashboard/admin/appointments",
      },
      { name: "Settings", icon: Settings, href: "/dashboard/admin/settings" },
    ],
    doctor: [
      { name: "Schedule", icon: Calendar, href: "/dashboard/doctor" },
      { name: "Patients", icon: Users, href: "/dashboard/doctor/patients" },
    ],
    receptionist: [
      {
        name: "Daily Flow",
        icon: LayoutDashboard,
        href: "/dashboard/receptionist",
      },
      {
        name: "Registration",
        icon: UserCircle,
        href: "/dashboard/receptionist/register",
      },
      { name: "Search", icon: Search, href: "/dashboard/receptionist/search" },
      {
        name: "Schedule",
        icon: Calendar,
        href: "/dashboard/receptionist/schedule",
      },
    ],
    patient: [
      { name: "Overview", icon: LayoutDashboard, href: "/dashboard/patient" },
      {
        name: "Medical Vault",
        icon: ClipboardList,
        href: "/dashboard/patient/records",
      },
      { name: "Book Visit", icon: Calendar, href: "/dashboard/patient/book" },
      { name: "Profile", icon: UserCircle, href: "/dashboard/patient/profile" },
    ],
  };

  const currentMenu = menuItems[role];

  return (
    <div className="h-screen bg-[#F0F4F8] dark:bg-[#0A122A] flex p-4 gap-4 font-sans selection:bg-[#1E4A8A]/10 dark:selection:bg-[#4A8AC8]/20 selection:text-[#1E4A8A] transition-colors duration-500 overflow-hidden">
      {/* Sidebar - Floating & Rounded */}
      <aside className="w-[280px] bg-white dark:bg-[#111C3A] border border-[#D0DCE8] dark:border-[#1A2A4A] flex flex-col rounded-[2.5rem] shadow-sm transition-all duration-500 shrink-0">
        <div className="p-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#1E4A8A] dark:bg-[#4A8AC8] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[#1E4A8A]/20 group hover:rotate-12 transition-transform duration-500">
              <Stethoscope size={24} />
            </div>
            <div>
              <span className="text-xl font-black tracking-tighter block leading-none text-[#1A2A4A] dark:text-[#E8EEF8]">
                MediCare
              </span>
              <span className="text-[10px] font-bold text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-[0.3em] mt-1 block">
                Cloud OS
              </span>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-6 space-y-2 mt-4 overflow-y-auto custom-scrollbar">
          <p className="text-[10px] font-black text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-widest px-4 mb-4">
            Main Menu
          </p>
          {currentMenu.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 relative group",
                  isActive
                    ? "bg-[#1E4A8A]/10 text-[#1E4A8A] dark:bg-[#4A8AC8]/10 dark:text-[#4A8AC8]"
                    : "text-[#5A6E8A] dark:text-[#8A9CBA] hover:bg-[#F0F4F8] dark:hover:bg-[#0A122A] hover:text-[#1E4A8A] dark:hover:text-[#4A8AC8]",
                )}
              >
                {isActive && (
                  <div className="absolute left-0 w-1.5 h-6 bg-[#1E4A8A] dark:bg-[#4A8AC8] rounded-r-full shadow-[0_0_15px_rgba(30,74,138,0.5)]" />
                )}
                <item.icon
                  size={20}
                  className={cn(
                    "transition-all duration-300",
                    isActive ? "scale-110" : "group-hover:scale-110",
                  )}
                />
                <span
                  className={cn(
                    "text-sm font-bold tracking-tight",
                    isActive
                      ? ""
                      : "group-hover:translate-x-1 transition-transform",
                  )}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* User Card */}
        <div className="p-8 mx-4 mb-6 bg-[#F0F4F8] dark:bg-[#0A122A] rounded-[2rem] border border-[#D0DCE8] dark:border-[#1A2A4A]">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1E4A8A] to-[#0F3A6A] flex items-center justify-center text-white font-black text-sm shadow-xl">
              {session?.user?.name?.[0] || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black truncate text-[#1A2A4A] dark:text-[#E8EEF8]">
                {session?.user?.name}
              </p>
              <p className="text-[9px] font-black text-[#1E4A8A] dark:text-[#4A8AC8] uppercase tracking-widest mt-0.5">
                {role}
              </p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-[#D94A5A]/10 hover:bg-[#D94A5A] text-[#D94A5A] hover:text-white rounded-xl transition-all duration-300 text-[10px] font-black uppercase tracking-widest"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area - Rounded & Floating */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#111C3A] border border-[#D0DCE8] dark:border-[#1A2A4A] rounded-[2.5rem] shadow-sm overflow-hidden transition-colors duration-500">
        {/* Top Header - Integrated & Rounded */}
        <header className="h-24 bg-white/50 dark:bg-[#111C3A]/50 backdrop-blur-md px-10 flex items-center justify-between z-40 transition-colors duration-500">
          <div className="flex items-center gap-4 bg-[#F0F4F8] dark:bg-[#0A122A] px-5 py-2.5 rounded-2xl border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-sm w-96 transition-colors duration-500">
            {/* <Search size={18} className="text-[#5A6E8A] dark:text-[#8A9CBA]" />
            <input
              type="text"
              placeholder="Search patient ID, records or labs..."
              className="bg-transparent border-none outline-none text-sm font-medium text-[#1A2A4A] dark:text-[#E8EEF8] w-full placeholder:text-[#5A6E8A] dark:placeholder:text-[#8A9CBA]"
            /> */}
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="w-12 h-12 rounded-2xl bg-white dark:bg-[#111C3A] border border-[#D0DCE8] dark:border-[#1A2A4A] flex items-center justify-center text-[#5A6E8A] dark:text-[#8A9CBA] hover:text-[#1E4A8A] dark:hover:text-[#4A8AC8] transition-all cursor-pointer shadow-sm active:scale-95"
            >
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#111C3A] border border-[#D0DCE8] dark:border-[#1A2A4A] flex items-center justify-center text-[#5A6E8A] dark:text-[#8A9CBA] hover:text-[#1E4A8A] dark:hover:text-[#4A8AC8] transition-colors cursor-pointer relative">
              <Bell size={20} />
              <span className="absolute top-3 right-3 w-2 h-2 bg-[#1E4A8A] dark:bg-[#4A8AC8] rounded-full border-2 border-white dark:border-[#111C3A]" />
            </div>
            <Link
              href={`/dashboard/${role}/settings`}
              className="w-12 h-12 rounded-2xl bg-white dark:bg-[#111C3A] border border-[#D0DCE8] dark:border-[#1A2A4A] flex items-center justify-center text-[#5A6E8A] dark:text-[#8A9CBA] hover:text-[#1E4A8A] dark:hover:text-[#4A8AC8] transition-colors cursor-pointer"
            >
              <Settings size={20} />
            </Link>
          </div>
        </header>

        {/* Content View */}
        <main className="flex-1 p-10 overflow-y-auto custom-scrollbar border-t border-[#F0F4F8] dark:border-[#0A122A] transition-colors duration-500">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
