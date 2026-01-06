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
  if (!role) return "VIEWER";
  return String(role).trim().toUpperCase();
}

export default function TopBar() {
  const pathname = usePathname();

  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const res = await fetch("/api/me", {
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) throw new Error("me_failed");
        const js = await res.json();
        if (!live) return;
        setMe({ email: js?.email ?? null, role: js?.role ?? null });
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

  const isInternal = ["SUPERADMIN", "ADMIN", "OFFICE", "DISPATCH"].includes(role);
  const isTech = role === "TECH";
  const isCustomer = ["CLIENT", "FM", "CUSTOMER"].includes(role);

  const navLinks = isInternal
    ? [
        { href: "/fm/requests/new", label: "New" },
        { href: "/office", label: "Office" },
        { href: "/dispatch", label: "Dispatch" },
        { href: "/tech", label: "Tech" },
        { href: "/reports", label: "Reports" },
        { href: "/admin/users", label: "Users" },
      ]
    : isCustomer
    ? [
        { href: "/portal", label: "Dashboard" },
        { href: "/portal/requests", label: "Requests" },
        { href: "/portal/vehicles", label: "Vehicles" },
        { href: "/portal/profile", label: "Profile" },
      ]
    : [];

  function isActive(href: string) {
    if (!pathname) return false;
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
      <div className="flex items-center gap-6">
        <Link
          href="/"
          className="text-[17px] font-semibold tracking-tight text-[#0A0A0A]"
        >
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

      <div className="flex items-center gap-4">
        {(isInternal || isTech || isCustomer) && <LocationSwitcher />}

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



