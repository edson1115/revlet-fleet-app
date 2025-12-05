"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { resolveUserScope } from "@/lib/api/scope"; // client-safe fetch wrapper

// -----------------------------------------
// Utility: Highlight active path
// -----------------------------------------
function MenuItem({
  href,
  label,
  disabled = false,
}: {
  href: string;
  label: string;
  disabled?: boolean;
}) {
  const pathname = usePathname();
  const active = pathname.startsWith(href);

  const base =
    "block px-5 py-2.5 rounded-xl text-sm transition font-medium";
  const activeStyle = "bg-black text-white shadow-sm";
  const inactiveStyle = "text-gray-700 hover:bg-gray-100";
  const disabledStyle =
    "text-gray-400 cursor-not-allowed opacity-50 hover:bg-transparent";

  return (
    <Link
      href={disabled ? "#" : href}
      className={
        base +
        " " +
        (disabled
          ? disabledStyle
          : active
          ? activeStyle
          : inactiveStyle)
      }
      onClick={(e) => disabled && e.preventDefault()}
    >
      {label}
    </Link>
  );
}

// -----------------------------------------
// Tesla Sidebar Component
// -----------------------------------------
export default function TeslaSidebar() {
  const [scope, setScope] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/auth/me");
      const json = await res.json();
      setScope(json.profile || null);
    })();
  }, []);

  if (!scope) {
    return (
      <aside className="w-64 h-screen border-r p-6 text-gray-500">
        Loading…
      </aside>
    );
  }

  const role = scope.role;
  const readOnlyDispatch = scope.readOnlyDispatch;
  const readOnlyOffice = scope.readOnlyOffice;

  return (
    <aside className="w-64 h-screen border-r bg-white p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Revlet</h1>
        <p className="text-xs text-gray-500 mt-1">
          {role} Dashboard
        </p>
      </div>

      <nav className="space-y-2">

        {/* SUPERADMIN — full access */}
        {role === "SUPERADMIN" && (
          <>
            <MenuItem href="/admin/dashboard" label="Admin Dashboard" />
            <MenuItem href="/dispatch" label="Dispatch" />
            <MenuItem href="/office" label="Office" />
            <MenuItem href="/tech" label="Technician" />
            <MenuItem href="/customer" label="Customers" />
            <MenuItem href="/settings/markets" label="Settings" />
          </>
        )}

        {/* DISPATCH */}
        {role === "DISPATCH" && (
          <>
            <MenuItem href="/dispatch/dashboard" label="My Dashboard" />
            <MenuItem href="/dispatch" label="Dispatch" />

            {/* Office read-only */}
            <MenuItem
              href="/office"
              label="Office (read only)"
              disabled={!readOnlyOffice}
            />

            <MenuItem href="/tech" label="Technician" />
            <MenuItem href="/customer" label="Customer Portal" />
          </>
        )}

        {/* OFFICE */}
        {role === "OFFICE" && (
          <>
            <MenuItem href="/office/dashboard" label="My Dashboard" />
            <MenuItem href="/office" label="Office" />

            {/* Dispatch read-only */}
            <MenuItem
              href="/dispatch"
              label="Dispatch (read only)"
              disabled={!readOnlyDispatch}
            />

            <MenuItem href="/customer" label="Customer Portal" />
          </>
        )}

        {/* TECH */}
        {role === "TECH" && (
          <>
            <MenuItem href="/tech/dashboard" label="My Dashboard" />
            <MenuItem href="/tech" label="My Jobs" />
          </>
        )}

        {/* CUSTOMER */}
        {role === "CUSTOMER" && (
          <>
            <MenuItem href="/customer/dashboard" label="My Dashboard" />
            <MenuItem href="/customer" label="My Requests" />
            <MenuItem href="/customer/vehicles" label="My Vehicles" />
          </>
        )}

      </nav>
    </aside>
  );
}
