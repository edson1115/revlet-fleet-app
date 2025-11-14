"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import LocationSwitcher from "@/components/LocationSwitcher";

type Me = {
  email?: string | null;
  role?: string | null;
};

function classNames(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function normalizeRole(role?: string | null) {
  if (!role) return "VIEWER";
  return String(role).trim().toUpperCase();
}

export default function MainNav() {
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
  const isCustomer = role.startsWith("CUSTOMER") || role === "CLIENT" || role === "FM";

  function isActive(href: string) {
    if (!pathname) return false;
    if (href === "/") return pathname === "/";
    if (href === "/reports") {
      return pathname === "/reports" || pathname.startsWith("/reports/");
    }
    return pathname === href || pathname.startsWith(href + "/");
  }

  // INTERNAL NAVIGATION (Office / Dispatch / Admin)
  const internalLinks = [
    { href: "/fm/requests/new", label: "Create Request" },
    { href: "/office", label: "Office Queue" },
    { href: "/dispatch", label: "Dispatch" },
    { href: "/tech", label: "Tech" },
    { href: "/reports", label: "Reports" },
    { href: "/admin/users", label: "Users" },
  ];

  // CUSTOMER PORTAL NAVIGATION
  const customerLinks = [
    { href: "/portal", label: "Dashboard" },
    { href: "/portal/requests", label: "Requests" },
    { href: "/portal/vehicles", label: "Vehicles" },
    { href: "/portal/profile", label: "Profile" },
    { href: "/portal/profile", label: "Profile", show: isCustomer,
      
    },

  ];

  return (
    <header className="w-full border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 gap-4">

        {/* LEFT SIDE: BRAND + NAV */}
        <div className="flex items-center gap-6">
          <Link href="/" className="text-sm font-semibold whitespace-nowrap">
            Revlet Fleet
          </Link>

          <nav className="flex flex-wrap items-center gap-4 text-sm">
            {isInternal &&
              internalLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={classNames(
                    "whitespace-nowrap",
                    isActive(link.href)
                      ? "font-semibold text-black"
                      : "text-gray-600 hover:text-black"
                  )}
                >
                  {link.label}
                </Link>
              ))}

            {isCustomer &&
              customerLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={classNames(
                    "whitespace-nowrap",
                    isActive(link.href)
                      ? "font-semibold text-black"
                      : "text-gray-600 hover:text-black"
                  )}
                >
                  {link.label}
                </Link>
              ))}
          </nav>
        </div>

        {/* RIGHT SIDE: Location + User + Logout */}
        <div className="flex items-center gap-3 text-xs">

          {(isInternal || isTech || isCustomer) && <LocationSwitcher />}

          {!loading && me && (
            <span className="hidden sm:inline text-gray-600">
              {me.email} • {role}
            </span>
          )}

          <Link
            href="/auth/signout"
            className="rounded border px-3 py-1 text-xs hover:bg-gray-50"
          >
            Sign out
          </Link>
        </div>
      </div>
    </header>
  );
}
