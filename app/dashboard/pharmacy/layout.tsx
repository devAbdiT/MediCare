"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import {
  LayoutDashboard,
  Pill,
  Package,
  ShoppingCart,
  Bell,
  Stethoscope,
  LogOut,
  Sun,
  Moon,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

export default function PharmacyLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending } = authClient.useSession();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isPending) {
      if (!session) {
        router.push("/login");
      } else {
        const role = (session.user as any).role;
        if (role !== "PHARMACIST" && role !== "ADMIN") {
          router.push("/login");
        }
      }
    }
  }, [session, isPending, router]);

  if (isPending || !session) return null;

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/login");
  };

  const [alertCount, setAlertCount] = useState<number>(0);

  useEffect(() => {
    async function checkAlerts() {
      try {
        const res = await fetch("/api/pharmacy/alerts");
        if (res.ok) {
          const data = await res.json();
          if (data.summary) {
            setAlertCount(data.summary.totalAlerts);
          }
        }
      } catch (err) {}
    }
    checkAlerts();
  }, [pathname]);

  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, href: "/dashboard/pharmacy" },
    { name: "Drug Catalogue", icon: Pill, href: "/dashboard/pharmacy/drugs" },
    { name: "Stock Management", icon: Package, href: "/dashboard/pharmacy/stock" },
    { name: "Dispense", icon: ShoppingCart, href: "/dashboard/pharmacy/dispense" },
    { name: "Alerts", icon: Bell, href: "/dashboard/pharmacy/alerts", badge: alertCount },
  ];

  return (
    <div className="h-screen bg-[#F0F4F8] dark:bg-[#0A122A] flex p-4 gap-4 font-sans selection:bg-[#7C3AED]/10 dark:selection:bg-[#7C3AED]/20 selection:text-[#7C3AED] transition-colors duration-500 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[280px] bg-white dark:bg-[#111C3A] border border-[#D0DCE8] dark:border-[#1A2A4A] flex flex-col rounded-[2.5rem] shadow-sm transition-all duration-500 shrink-0 print:hidden">
        <div className="p-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#7C3AED] dark:bg-[#6D28D9] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[#7C3AED]/20 group hover:rotate-12 transition-transform duration-500">
              <Pill size={24} />
            </div>
            <div>
              <span className="text-xl font-black tracking-tighter block leading-none text-[#1A2A4A] dark:text-[#E8EEF8]">
                MediCare
              </span>
              <span className="text-[10px] font-bold text-[#7C3AED] dark:text-[#8B5CF6] uppercase tracking-[0.3em] mt-1 block">
                Pharmacy
              </span>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-6 space-y-2 mt-4 overflow-y-auto custom-scrollbar">
          <p className="text-[10px] font-black text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-widest px-4 mb-4">
            Main Menu
          </p>
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 relative group",
                  isActive
                    ? "bg-[#7C3AED]/10 text-[#7C3AED] dark:bg-[#7C3AED]/20 dark:text-[#A78BFA]"
                    : "text-[#5A6E8A] dark:text-[#8A9CBA] hover:bg-[#F0F4F8] dark:hover:bg-[#0A122A] hover:text-[#7C3AED] dark:hover:text-[#A78BFA]"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 w-1.5 h-6 bg-[#7C3AED] dark:bg-[#8B5CF6] rounded-r-full shadow-[0_0_15px_rgba(124,58,237,0.5)]" />
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
                    "text-sm font-bold tracking-tight flex-1",
                    isActive ? "" : "group-hover:translate-x-1 transition-transform"
                  )}
                >
                  {item.name}
                </span>
                {item.badge && item.badge > 0 ? (
                  <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-black">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="p-6">
          <div className="bg-[#F0F4F8] dark:bg-[#0A122A] p-4 rounded-3xl flex items-center justify-between border border-[#D0DCE8] dark:border-[#1A2A4A] transition-colors duration-500">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="w-10 h-10 rounded-2xl bg-white dark:bg-[#111C3A] text-[#5A6E8A] dark:text-[#8A9CBA] flex items-center justify-center hover:text-[#7C3AED] dark:hover:text-[#A78BFA] transition-colors shadow-sm"
            >
              {mounted && theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              onClick={handleSignOut}
              className="w-10 h-10 rounded-2xl bg-white dark:bg-[#111C3A] text-red-500 flex items-center justify-center hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 transition-colors shadow-sm"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 bg-white dark:bg-[#111C3A] rounded-[2.5rem] border border-[#D0DCE8] dark:border-[#1A2A4A] overflow-hidden flex flex-col shadow-sm transition-colors duration-500">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-10">
          {children}
        </div>
      </main>
    </div>
  );
}
