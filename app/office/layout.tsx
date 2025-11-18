"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { normalizeRole, roleToPermissions, type Role } from "@/lib/permissions";

export default function OfficeLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/me", {
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) {
          setAllowed(false);
          setReady(true);
          return;
        }

        const js = await res.json();
        const roleRaw = js?.role ?? null;
        const role = normalizeRole(roleRaw);

        const perms = roleToPermissions(role);

        // Office screen should only be visible to OFFICE, ADMIN, SUPERADMIN
        if (perms.canOfficeQueue) {
          setAllowed(true);
        } else {
          setAllowed(false);
        }
      } catch {
        setAllowed(false);
      } finally {
        setReady(true);
      }
    }

    load();
  }, []);

  if (!ready) {
    return (
      <div className="p-6 text-gray-600 text-sm">
        Checking permissions…
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="p-6 text-red-700 text-sm">
        You do not have permission to access the Office screen.
      </div>
    );
  }

  return <div className="p-4">{children}</div>;
}
