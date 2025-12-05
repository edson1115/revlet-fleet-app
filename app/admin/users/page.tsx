// app/admin/users/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type MeResp = {
  ok: boolean;
  authed: boolean;
  role?: string;
  permissions?: Record<string, unknown>;
};

async function getJSON<T>(url: string): Promise<T> {
  const r = await fetch(url, { credentials: "include", cache: "no-store" });
  if (!r.ok) throw new Error(await r.text().catch(() => r.statusText));
  return (await r.json()) as T;
}

export const dynamic = "force-dynamic";

export default function AdminUsersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let on = true;
    (async () => {
      try {
        const me = await getJSON<any>("/api/me");
        const role = String(me?.role || me?.me?.role || "").toUpperCase();
        if (on) setAuthorized(role === "SUPERADMIN");
      } catch (e: any) {
        if (on) setErr(e?.message || "Failed to verify access");
      } finally {
        if (on) setLoading(false);
      }
    })();
    return () => { on = false; };
  }, []);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="text-sm text-gray-500">Loading…</div>
      </div>
    );
  }

  if (authorized === false) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-semibold mb-2">Users</h1>
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          You don’t have access to this page.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-3">
      <h1 className="text-2xl font-semibold">Users</h1>
      <p className="text-sm text-gray-600">
        SUPERADMIN-only area. A minimal page is in place so navigation works.
      </p>

      {err && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {err}
        </div>
      )}

      <div className="rounded-2xl border bg-white shadow-sm p-4 space-y-2">
        <p className="text-sm text-gray-700">
          Coming soon: user listing, resend invite/recovery, role & scope editor, and audit log.
        </p>
        <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
          <li>Read profiles + auth users</li>
          <li>Resend invite or generate recovery link</li>
          <li>Edit role, <span className="font-mono">location_ids</span>, and <span className="font-mono">customer_id</span></li>
          <li>Delete user (auth + profile)</li>
          <li>Audit log of changes</li>
        </ul>
      </div>
    </div>
  );
}



