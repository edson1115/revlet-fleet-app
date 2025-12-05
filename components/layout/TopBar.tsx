"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import LocationSwitcher from "@/components/LocationSwitcher";
import { cn } from "@/lib/utils";

type Me = {
  email?: string | null;
  role?: string | null;
};

function normalizeRole(role?: string | null) {
  if (!role) return "PUBLIC";
  return String(role).trim().toUpperCase();
}

export default function TopBar() {
  const pathname = usePathname();
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  // ------------------------------------
  // LOAD USER
  // ------------------------------------
  useEffect(() => {
    let live = true;

    (async () => {
      try {
        const res = await fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
        });
        const js = await res.json();
        if (!live) return;
        setMe({
          email: js?.profile?.email ?? js?.user?.email ?? null,
          role: js?.profile?.role ?? null,
        });
      } catch {
        if (!live) return;
        setMe(null);
      } finally {
        if (live) setLoading(false);
      }
    })();

    return () => {
      live = false;
    };
  }, []);

  const role = normalizeRole(me?.role);
  
  const isSuper = role === "SUPERADMIN";
  const isDispatch = role === "DISPATCH";
  const isOffice = role === "OFFICE";
  const isTech = role === "TECH";
  const isCustomer = ["CLIENT", "FM", "CUSTOMER"].includes(role);

  // ------------------------------------
  // NAVIGATION MAP
  // ------------------------------------
  let navLinks: { href: string; label: string }[] = [];

  if (isSuper) {
    navLinks = [
      { href: "/admin/dashboard", label: "Dashboard" },
      { href: "/office", label: "Office" },
      { href: "/dispatch", label: "Dispatch" },
      { href: "/tech", label: "Tech" },
      { href: "/customer", label: "Customers" },
      { href: "/admin/users", label: "Users" },
      { href: "/settings", label: "Settings" },
    ];
  }

  if (isDispatch) {
    navLinks = [
      { href: "/dispatch/dashboard", label: "Dashboard" },
      { href: "/dispatch", label: "Dispatch" },
      { href: "/tech", label: "Tech" },
      { href: "/customer", label: "Customers" },
    ];
  }

  if (isOffice) {
    navLinks = [
      { href: "/office/dashboard", label: "Dashboard" },
      { href: "/office", label: "Office" },
      { href: "/dispatch", label: "Dispatch" },
      { href: "/customer", label: "Customers" },
    ];
  }

  if (isTech) {
    navLinks = [
      { href: "/tech", label: "Tech Dashboard" },
    ];
  }

  if (isCustomer) {
    navLinks = [
      { href: "/portal/dashboard", label: "Dashboard" },
      { href: "/portal/requests", label: "Requests" },
      { href: "/portal/vehicles", label: "Vehicles" },
      { href: "/portal/profile", label: "Profile" },
    ];
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <header
      className={cn(
        "w-full sticky top-0 z-50",
        "backdrop-blur-md bg-white/70 border-b border-gray-200/60",
        "flex items-center justify-between px-6 py-3"
      )}
    >
      {/* LEFT SIDE */}
      <div className="flex items-center gap-6">
        <Link href="/" className="text-[17px] font-semibold tracking-tight">
          Revlet Fleet
        </Link>

        <nav className="hidden md:flex items-center gap-4 text-sm">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "px-2 py-1 rounded-md transition-all",
                isActive(link.href)
                  ? "font-semibold text-black"
                  : "text-gray-600 hover:text-black hover:bg-gray-100/70"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center gap-4">
        {(isSuper || isDispatch || isOffice || isTech || isCustomer) && (
          <LocationSwitcher />
        )}

        {me && !loading && (
          <span className="hidden sm:block text-[13px] text-gray-600">
            {me.email} • {role}
          </span>
        )}

        <Link
          href="/auth/signout"
          className="text-xs rounded-md border px-3 py-1 hover:bg-gray-50"
        >
          Sign out
        </Link>
      </div>
    </header>
  );
}
