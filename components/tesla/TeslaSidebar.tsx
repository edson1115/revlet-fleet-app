"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function TeslaSidebar() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/auth/me", {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        });

        if (!res.ok) {
          setRole(null);
          setLoading(false);
          return;
        }

        const js = await res.json();

        if (js?.ok && js.role) {
          setRole(js.role);
        } else {
          setRole(null);
        }
      } catch (err) {
        console.error("Sidebar auth error:", err);
        setRole(null);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) return null;
  if (!role) return null;

  // --------------------------
  // MENU DEFINITIONS
  // --------------------------

  const common = [{ label: "Home", href: "/" }];

  const office = [
    { label: "Office Dashboard", href: "/office" },
    { label: "Requests", href: "/office/requests" },
    { label: "Customers", href: "/office/customers" },
    { label: "Vehicles", href: "/office/vehicles" },
  ];

  const dispatchMenu = [
    { label: "Dispatch Dashboard", href: "/dispatch" },
    { label: "Queue", href: "/dispatch/queue" },
  ];

  const techMenu = [
    { label: "Tech Jobs", href: "/tech/jobs" },
  ];

  const admin = [
    { label: "Admin Dashboard", href: "/admin" },
  ];

  // --------------------------
  // CUSTOMER MENU — NEW
  // --------------------------
  const customer = [
  { label: "Portal Home", href: "/portal" },
  { label: "Vehicles", href: "/customer/vehicles" },
  { label: "Requests", href: "/customer/requests" },
  { label: "New Request", href: "/customer/requests/new" },
  { label: "Profile", href: "/customer/profile" }
];


  // --------------------------
  // ROLE SWITCH
  // --------------------------

  function getMenu() {
    switch (role) {
      case "SUPERADMIN":
        return [...common, ...office, ...dispatchMenu, ...techMenu, ...admin];
      case "ADMIN":
        return [...common, ...office, ...dispatchMenu, ...techMenu];
      case "OFFICE":
        return [...common, ...office];
      case "DISPATCH":
        return [...common, ...dispatchMenu];
      case "TECH":
        return [...common, ...techMenu];
      case "CUSTOMER":
        return [...customer];
      default:
        return common;
    }
  }

  const menu = getMenu();

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.error("Logout error:", e);
    } finally {
      window.location.href = "/login";
    }
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-56 border-r bg-white p-5 space-y-5 z-40">
      <h2 className="text-xl font-semibold tracking-tight">Revlet</h2>

      <nav className="space-y-2">
        {menu.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block py-2 px-3 rounded-lg hover:bg-gray-100 transition"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <button
        onClick={handleLogout}
        className="mt-4 w-full py-2 px-3 rounded-lg bg-red-500 text-white hover:bg-red-600"
      >
        Logout
      </button>
    </aside>
  );
}
