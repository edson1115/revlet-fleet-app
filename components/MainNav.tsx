// components/MainNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import LocationSwitcher from "@/components/LocationSwitcher";
import UserChip from "@/components/UserChip";

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
        if (live) setMe({ email: js?.email ?? null, role: js?.role ?? null });
      } catch {
        if (live) setMe(null);
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
  const isCustomer =
    role.startsWith("CUSTOMER") || role === "CLIENT" || role === "FM";

  function isActive(href: string) {
    if (!pathname) return false;
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  }

  const internalLinks = [
    { href: "/fm/requests/new", label: "Create Request" },
    { href: "/office", label: "Office" },
    { href: "/dispatch", label: "Dispatch" },
    { href: "/tech", label: "Tech" },
    { href: "/reports", label: "Reports" },
    { href: "/admin/users", label: "Users" },
  ];

  const customerLinks = [
    { href: "/portal", label: "Dashboard" },
    { href: "/portal/requests", label: "Requests" },
    { href: "/portal/vehicles", label: "Vehicles" },
    { href: "/portal/profile", label: "Profile" },
  ];

  return (
    <header
      className="
        sticky top-0 z-40
        backdrop-blur-md
        bg-[var(--surface-bg)]/80
        shadow-sm
        border-b border-transparent
      "
      style={{ WebkitBackdropFilter: "blur(12px)" }}
    >
      <div
        className="
          mx-auto max-w-7xl
          flex items-center justify-between
          px-4 py-3
          text-[var(--revlet-black)]
        "
      >
        {/* LEFT SIDE: logo + nav */}
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="
              text-lg font-medium
              tracking-tight
              hover:opacity-80
              transition-opacity
            "
            style={{ fontWeight: "500", fontSize: "18px" }}
          >
            Revlet Fleet
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm">
            {isInternal &&
              internalLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={classNames(
                    "transition-opacity",
                    "hover:opacity-80",
                    isActive(link.href)
                      ? "text-[var(--revlet-black)] font-medium"
                      : "text-gray-500"
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
                    "transition-opacity",
                    "hover:opacity-80",
                    isActive(link.href)
                      ? "text-[var(--revlet-black)] font-medium"
                      : "text-gray-500"
                  )}
                >
                  {link.label}
                </Link>
              ))}
          </nav>
        </div>

        {/* RIGHT SIDE: Location + User */}
        <div className="flex items-center gap-4">
          {(isInternal || isTech || isCustomer) && (
            <div className="hidden sm:block">
              <LocationSwitcher />
            </div>
          )}

          <UserChip />
        </div>
      </div>
    </header>
  );
}
