"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function TeslaSidebar() {
  const [role, setRole] = useState<string | null>(null);

  // Load the user's role
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const js = await res.json();
        if (js.ok) setRole(js.role);
      } catch {
        setRole(null);
      }
    }
    load();
  }, []);

  if (!role) return null;

  // ---------------------------------------------------------
  // CLEAN NAVIGATION MAP (FINAL WORKING VERSION)
  // FMC Dashboard removed, replaced by expanded VehicleDrawer
  // ---------------------------------------------------------
  const NAV: Record<string, Array<{ label: string; href: string }>> = {
    CUSTOMER: [
      { label: "Home", href: "/customer" },
      { label: "My Vehicles", href: "/customer/vehicles" },
      { label: "Add Vehicle", href: "/customer/vehicles/add" },
      { label: "My Requests", href: "/customer/requests" },
      { label: "New Request", href: "/customer/requests/new" },
      { label: "Tire Purchase", href: "/customer/requests/tire-purchase" },
    ],

    SUPERADMIN: [
      { label: "Dashboard", href: "/admin/dashboard" },
      { label: "Markets", href: "/admin/markets" },
      { label: "Users", href: "/admin/users" },
    ],

    ADMIN: [
      { label: "Dashboard", href: "/admin/dashboard" },
      { label: "Customers", href: "/admin/customers" },
    ],

    OFFICE: [
      { label: "Office Queue", href: "/office/queue" },
      { label: "Requests", href: "/office/requests" },
    ],

    DISPATCH: [
      { label: "Dispatch Queue", href: "/dispatch/queue" },
      { label: "Scheduled", href: "/dispatch/scheduled" },
    ],

    TECH: [
      { label: "My Jobs", href: "/tech/queue" },
      { label: "Completed", href: "/tech/completed" },
    ],
  };

  const items = NAV[role] || [];

  return (
    <aside className="hidden md:block w-60 bg-white border-r border-gray-200 p-6">
      <nav className="space-y-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
