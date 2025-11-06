// lib/useMe.ts
"use client";
import { useEffect, useState } from "react";
import type { Role, Permissions } from "@/lib/permissions";

export type MeResp = {
  ok: boolean;
  id: string;
  role: Role;
  name?: string | null;
  email?: string | null;
  company_id?: string | null;
  customer_id?: string | null;
  permissions: Permissions;
  scope: {
    companyId?: string | null;
    customerId?: string | null;
    locationIds?: string[];
    technicianId?: string | null;
  };
};

export function useMe() {
  const [me, setMe] = useState<MeResp | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let on = true;
    (async () => {
      try {
        const r = await fetch("/api/me", { credentials: "include" });
        const js: MeResp = await r.json();
        if (on && r.ok) setMe(js);
      } catch {
        if (on) setMe(null);
      } finally {
        if (on) setLoading(false);
      }
    })();
    return () => { on = false; };
  }, []);

  return { me, loading, role: me?.role, perms: me?.permissions, scope: me?.scope };
}
