// app/office/layout.tsx
"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Permissions, Role } from "@/lib/permissions";

type MePayload =
  | {
      ok: true;
      id: string;
      role: Role;
      name: string | null;
      email: string | null;
      company_id: string | null;
      customer_id: string | null;
      permissions: Permissions;
      scope: {
        companyId: string | null;
        customerId: string | null;
        locationIds: string[];
        technicianId: string | null;
      };
    }
  | { error: string };

export default function OfficeLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const res = await fetch("/api/me", { credentials: "include" });

        // Not signed in → go to login, preserve return path
        if (res.status === 401) {
          router.replace("/login?next=/office");
          return;
        }

        const data = (await res.json()) as MePayload;

        // If the route returns a non-ok payload, treat as not allowed
        if (!("ok" in data) || !data.ok) {
          router.replace("/");
          return;
        }

        const canSee = !!data.permissions?.canSeeOffice;

        if (!canSee) {
          // Signed in but not authorized for Office
          router.replace("/");
          return;
        }

        if (alive) {
          setAllowed(true);
          setReady(true);
        }
      } catch {
        // Network/other error → play it safe and bounce
        router.replace("/");
      } finally {
        if (alive) setReady(true);
      }
    })();

    return () => {
      alive = false;
    };
  }, [router]);

  // Avoid UI flash while we decide
  if (!ready || !allowed) return null;

  return <div className="max-w-7xl mx-auto p-4">{children}</div>;
}
