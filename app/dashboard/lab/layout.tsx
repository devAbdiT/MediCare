// app/dashboard/lab/layout.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import {
  FlaskConical,
  LayoutDashboard,
  ClipboardList,
  BookOpen,
  Settings,
  LogOut,
  Sun,
  Moon,
  Bell,
  Loader2,
} from "lucide-react";

const NAV_LINKS = [
  { name: "Dashboard",      icon: LayoutDashboard, href: "/dashboard/lab" },
  { name: "Orders Queue",   icon: ClipboardList,   href: "/dashboard/lab/orders" },
  { name: "Test Catalogue", icon: BookOpen,         href: "/dashboard/lab/catalogue" },
  { name: "Settings",       icon: Settings,         href: "/dashboard/lab/settings" },
];

export default function LabDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router   = useRouter();
  const pathname = usePathname();
  const { data: session, isPending } = authClient.useSession();
  const { theme, setTheme } = useTheme();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (isPending) return;
    if (!session) {
      router.replace("/login");
      return;
    }
    const role = (session.user as any).role as string;
    if (role !== "LABTECH" && role !== "ADMIN") {
      router.replace(`/dashboard/${role.toLowerCase()}`);
      return;
    }
    setChecking(false);
  }, [session, isPending, router]);

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/login");
  };

  if (isPending || checking) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F0F4F8] dark:bg-[#0A122A]">
        <Loader2 size={32} className="animate-spin text-teal-600 dark:text-teal-400" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#F0F4F8] dark:bg-[#0A122A] flex p-4 gap-4 font-sans overflow-hidden transition-colors duration-500">
      {/* ── Sidebar ── */}
      <aside className="w-[280px] bg-white dark:bg-[#0D1F1E] border border-[#CCECE9] dark:border-[#0F3330] flex flex-col rounded-[2.5rem] shadow-sm transition-all duration-500 shrink-0 print:hidden">
        {/* Logo */}
        <div className="p-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-teal-600 dark:bg-teal-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-teal-600/20 hover:rotate-12 transition-transform duration-500">
              <FlaskConical size={24} />
            </div>
            <div>
              <span className="text-xl font-black tracking-tighter block leading-none text-[#1A2A4A] dark:text-[#E8EEF8]">
                MediCare
              </span>
              <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-[0.3em] mt-1 block">
                Lab Portal
              </span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-6 space-y-2 mt-2 overflow-y-auto">
          <p className="text-[10px] font-black text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-widest px-4 mb-4">
            Main Menu
          </p>
          {NAV_LINKS.map((item) => {
            const isActive =
              item.href === "/dashboard/lab"
                ? pathname === "/dashboard/lab"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 relative group",
                  isActive
                    ? "bg-teal-600/10 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400"
                    : "text-[#5A6E8A] dark:text-[#8A9CBA] hover:bg-[#F0F4F8] dark:hover:bg-[#0A1A1A] hover:text-teal-700 dark:hover:text-teal-400"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 w-1.5 h-6 bg-teal-600 dark:bg-teal-400 rounded-r-full shadow-[0_0_15px_rgba(13,148,136,0.5)]" />
                )}
                <item.icon
                  size={20}
                  className={cn(
                    "transition-all duration-300",
                    isActive ? "scale-110" : "group-hover:scale-110"
                  )}
                />
                <span
                  className={cn(
                    "text-sm font-bold tracking-tight",
                    !isActive && "group-hover:translate-x-1 transition-transform"
                  )}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* User Card */}
        <div className="p-8 mx-4 mb-6 bg-[#F0F4F8] dark:bg-[#0A1A1A] rounded-[2rem] border border-[#CCECE9] dark:border-[#0F3330]">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-teal-800 flex items-center justify-center text-white font-black text-sm shadow-xl">
              {session?.user?.name?.[0]?.toUpperCase() ?? "L"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black truncate text-[#1A2A4A] dark:text-[#E8EEF8]">
                {session?.user?.name}
              </p>
              <p className="text-[9px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest mt-0.5">
                Lab Technician
              </p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all duration-300 text-[10px] font-black uppercase tracking-widest"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#0D1F1E] border border-[#CCECE9] dark:border-[#0F3330] rounded-[2.5rem] shadow-sm overflow-hidden transition-colors duration-500">
        {/* Header */}
        <header className="h-24 bg-white/50 dark:bg-[#0D1F1E]/50 backdrop-blur-md px-10 flex items-center justify-between z-40 transition-colors duration-500 print:hidden">
          <div className="flex items-center gap-4 bg-[#F0F4F8] dark:bg-[#0A1A1A] px-5 py-2.5 rounded-2xl border border-[#CCECE9] dark:border-[#0F3330] shadow-sm w-80">
            {/* Reserved for global search */}
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="w-12 h-12 rounded-2xl bg-white dark:bg-[#0D1F1E] border border-[#CCECE9] dark:border-[#0F3330] flex items-center justify-center text-[#5A6E8A] dark:text-[#8A9CBA] hover:text-teal-600 dark:hover:text-teal-400 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#0D1F1E] border border-[#CCECE9] dark:border-[#0F3330] flex items-center justify-center text-[#5A6E8A] dark:text-[#8A9CBA] hover:text-teal-600 dark:hover:text-teal-400 transition-colors cursor-pointer relative">
              <Bell size={20} />
              <span className="absolute top-3 right-3 w-2 h-2 bg-teal-500 rounded-full border-2 border-white dark:border-[#0D1F1E]" />
            </div>
            <Link
              href="/dashboard/lab/settings"
              className="w-12 h-12 rounded-2xl bg-white dark:bg-[#0D1F1E] border border-[#CCECE9] dark:border-[#0F3330] flex items-center justify-center text-[#5A6E8A] dark:text-[#8A9CBA] hover:text-teal-600 dark:hover:text-teal-400 transition-colors cursor-pointer"
            >
              <Settings size={20} />
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-10 overflow-y-auto custom-scrollbar border-t border-[#F0F4F8] dark:border-[#0A1A1A] transition-colors duration-500">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
