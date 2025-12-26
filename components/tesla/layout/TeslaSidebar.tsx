"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import clsx from "clsx";

export function TeslaSidebar() {
  const [role, setRole] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const js = await res.json();
        
        if (js.ok && js.user?.role) {
          // ✅ FIX: Normalize to uppercase to match NAV keys safely
          const r = js.user.role.toUpperCase();
          // Map 'USER' -> 'CUSTOMER' if legacy data exists
          setRole(r === "USER" ? "CUSTOMER" : r);
        }
      } catch (e) {
        console.error("Sidebar auth load failed", e);
      }
    }
    load();
  }, []);

  if (!role) return null; // Or return a skeleton loader

  // ---------------------------------------------------------
  // NAVIGATION MAP
  // ---------------------------------------------------------
  const NAV: Record<string, Array<{ label: string; href: string; icon?: string }>> = {
    CUSTOMER: [
      { label: "Dashboard", href: "/customer", icon: "⊞" },
      { label: "My Vehicles", href: "/customer/vehicles", icon: "🚗" },
      { label: "Add Vehicle", href: "/customer/vehicles/add", icon: "➕" },
      { label: "My Requests", href: "/customer/requests", icon: "🔧" },
      { label: "New Request", href: "/customer/requests/new", icon: "⚡" },
      { label: "Tire Purchase", href: "/customer/requests/tire-purchase", icon: "🛞" }, // ✅ RESTORED
    ],
    OFFICE: [
      { label: "Dashboard", href: "/office", icon: "📊" },
      { label: "Requests", href: "/office/requests", icon: "📥" },
      { label: "Customers", href: "/office/customers", icon: "👥" },
    ],
    // ... add other roles as needed
  };

  const items = NAV[role] || [];

  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex-col hidden md:flex h-screen sticky top-0">
      
      {/* BRAND HEADER */}
      <div className="h-16 flex items-center px-6 border-b border-gray-100 shrink-0">
         <span className="font-bold text-xl tracking-tight text-black">REVLET</span>
         <span className="ml-2 text-[10px] font-bold text-white bg-black px-1.5 py-0.5 rounded uppercase">
            {role}
         </span>
      </div>

      {/* NAV LINKS */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                isActive
                  ? "bg-black text-white shadow-md"
                  : "text-gray-500 hover:bg-gray-50 hover:text-black"
              )}
            >
              {item.icon && <span className="text-lg">{item.icon}</span>}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* FOOTER (Optional version info) */}
      <div className="p-4 border-t border-gray-100 text-xs text-gray-400 text-center">
        v2.0.1 Tesla UI
      </div>
    </aside>
  );
}