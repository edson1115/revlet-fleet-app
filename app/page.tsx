// app/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Me = {
  role?: string | null;
  email?: string | null;
  permissions?: {
    canSeeOffice?: boolean;
    canSeeDispatch?: boolean;
    canSeeTech?: boolean;
    canSeeAdmin?: boolean;
    canSeeReports?: boolean;
  } | null;
};

async function getMe(): Promise<{ me: Me | null; authed: boolean }> {
  try {
    const res = await fetch("/api/me", { credentials: "include", cache: "no-store" });
    if (res.status === 401) return { me: null, authed: false };
    if (!res.ok) throw new Error(String(res.status));
    return { me: await res.json(), authed: true };
  } catch {
    return { me: null, authed: false };
  }
}

export default function Home() {
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    let live = true;
    (async () => {
      const { me } = await getMe();
      if (!live) return;
      setMe(me);
    })();
    return () => { live = false; };
  }, []);

  const role = String(me?.role || "VIEWER").toUpperCase();
  const canSeeOffice  = role === "SUPERADMIN" || me?.permissions?.canSeeOffice  || role === "OFFICE" || role === "DISPATCH";
  const canSeeDispatch= role === "SUPERADMIN" || me?.permissions?.canSeeDispatch|| role === "DISPATCH";
  const canSeeTech    = role === "SUPERADMIN" || me?.permissions?.canSeeTech    || role === "TECH";
  const canSeeAdmin   = role === "SUPERADMIN" || me?.permissions?.canSeeAdmin   || role === "ADMIN" || role === "OFFICE" || role === "DISPATCH";
  const canSeeReports = role === "SUPERADMIN" || me?.permissions?.canSeeReports || role === "ADMIN" || role === "OFFICE" || role === "DISPATCH";

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
      <h1 className="text-2xl font-semibold">Revlet Fleet</h1>

      {role && (
        <div className="rounded border border-emerald-200 bg-emerald-50 text-emerald-800 px-3 py-2">
          You are signed in with role <strong>{role}</strong>.
        </div>
      )}

      <ul className="list-disc pl-5 space-y-2">
        <li>
          <Link href="/fm/requests/new" className="underline">Create Request (Customer)</Link>
        </li>

        {/* ✅ Office now goes to /office */}
        {canSeeOffice && (
          <li>
            <Link href="/office" className="underline">Office Queue</Link>
          </li>
        )}

        {canSeeDispatch && (
          <li>
            <Link href="/dispatch" className="underline">Dispatch</Link>
          </li>
        )}

        {canSeeTech && (
          <li>
            <Link href="/tech/my-jobs" className="underline">Tech</Link>
          </li>
        )}

        {canSeeReports && (
          <li>
            <Link href="/reports" className="underline">Reports</Link>
          </li>
        )}

        {canSeeAdmin && (
          <li>
            <Link href="/admin" className="underline">Admin</Link>
          </li>
        )}
      </ul>
    </div>
  );
}
