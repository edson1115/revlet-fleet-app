"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { normalizeRole } from "@/lib/permissions";

export default function CustomerPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  // Allowed roles (only declare ONCE)
  const customerRoles = new Set(["CUSTOMER"]);
  const internalRoles = new Set([
    "OFFICE",
    "DISPATCH",
    "ADMIN",
    "SUPERADMIN",
    "FLEET_MANAGER",
    "TECH",
  ]);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const res = await fetch("/api/me", {
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) {
          if (active) {
            setAuthorized(false);
            setLoading(false);
          }
          return;
        }

        const js = await res.json();
        const raw = js?.role ?? null;
        const norm = normalizeRole(raw);

        if (active) {
          setRole(norm);

          // Fix: norm may be null — ensure it's a string before checking sets
          const r = norm ?? "";

          if (!customerRoles.has(r) && !internalRoles.has(r)) {
            setAuthorized(false);
          } else {
            setAuthorized(true);
          }

          setLoading(false);
        }
      } catch {
        if (active) {
          setAuthorized(false);
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="p-6 text-gray-600 text-sm">Checking access…</div>
    );
  }

  if (!authorized) {
    return (
      <div className="p-6 text-red-700 text-sm">
        You do not have permission to view this page.
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-2">Customer Portal</h1>
      <p className="text-gray-600">Welcome to your customer dashboard.</p>

      <div className="mt-6">
        <a
          href="/customer/vehicles"
          className="inline-block px-4 py-2 border rounded hover:bg-gray-50"
        >
          View Vehicles
        </a>
      </div>
    </div>
  );
}
