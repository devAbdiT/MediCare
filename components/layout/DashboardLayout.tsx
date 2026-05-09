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
  Bell
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: "admin" | "doctor" | "receptionist" | "patient";
}

export default function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = authClient.useSession();

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/login");
  };

  const menuItems = {
    admin: [
      { name: "Overview", icon: LayoutDashboard, href: "/dashboard/admin" },
      { name: "All Users", icon: Users, href: "/dashboard/admin/users" },
      { name: "Appointments", icon: Calendar, href: "/dashboard/admin/appointments" },
      { name: "Settings", icon: Settings, href: "/dashboard/admin/settings" },
    ],
    doctor: [
      { name: "Schedule", icon: Calendar, href: "/dashboard/doctor" },
      { name: "Patients", icon: Users, href: "/dashboard/doctor/patients" },
      { name: "Messages", icon: Bell, href: "/dashboard/doctor/messages" },
    ],
    receptionist: [
      { name: "Daily Flow", icon: LayoutDashboard, href: "/dashboard/receptionist" },
      { name: "Registration", icon: UserCircle, href: "/dashboard/receptionist/register" },
      { name: "Search", icon: Search, href: "/dashboard/receptionist/search" },
    ],
    patient: [
      { name: "Overview", icon: LayoutDashboard, href: "/dashboard/patient" },
      { name: "Medical Vault", icon: ClipboardList, href: "/dashboard/patient/records" },
      { name: "Book Visit", icon: Calendar, href: "/dashboard/patient/book" },
      { name: "Profile", icon: UserCircle, href: "/dashboard/patient/profile" },
    ],
  };

  const currentMenu = menuItems[role];

  return (
    <div className="min-h-screen bg-[#F4F7FE] flex font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Sidebar - Modern Deep Dark Theme */}
      <aside className="w-[280px] bg-[#0A0D14] text-white flex flex-col sticky top-0 h-screen shadow-[20px_0_40px_rgba(0,0,0,0.05)] z-50">
        <div className="p-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-[0_0_20px_rgba(79,70,229,0.4)] group hover:rotate-12 transition-transform duration-500">
              <Stethoscope size={24} />
            </div>
            <div>
              <span className="text-xl font-black tracking-tighter block leading-none">MediCare</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mt-1 block">Cloud OS</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-6 space-y-2 mt-4">
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-4 mb-4">Main Menu</p>
          {currentMenu.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 relative group",
                  isActive 
                    ? "bg-indigo-600/10 text-white" 
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 w-1.5 h-6 bg-indigo-500 rounded-r-full shadow-[0_0_15px_rgba(99,102,241,0.8)]" />
                )}
                <item.icon size={20} className={cn("transition-all duration-300", isActive ? "text-indigo-400 scale-110" : "group-hover:scale-110")} />
                <span className={cn("text-sm font-bold tracking-tight", isActive ? "text-white" : "group-hover:translate-x-1 transition-transform")}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* User Card */}
        <div className="p-8 mx-4 mb-4 bg-white/5 rounded-[2.5rem] border border-white/5 backdrop-blur-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-lg shadow-xl">
              {session?.user?.name?.[0] || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black truncate text-white">{session?.user?.name}</p>
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-0.5">{role}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-3 px-5 py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all duration-300 text-xs font-black uppercase tracking-widest"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-24 bg-white/50 backdrop-blur-md border-b border-slate-200/50 px-10 flex items-center justify-between sticky top-0 z-40">
           <div className="flex items-center gap-4 bg-white px-5 py-2.5 rounded-2xl border border-slate-200 shadow-sm w-96">
              <Search size={18} className="text-slate-400" />
              <input 
                type="text" 
                placeholder="Search patient ID, records or labs..." 
                className="bg-transparent border-none outline-none text-sm font-medium text-slate-600 w-full placeholder:text-slate-300"
              />
           </div>
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer relative">
                 <Bell size={20} />
                 <span className="absolute top-3 right-3 w-2 h-2 bg-indigo-500 rounded-full border-2 border-white" />
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer">
                 <Settings size={20} />
              </div>
           </div>
        </header>

        {/* Content View */}
        <main className="flex-1 p-10 overflow-y-auto custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
