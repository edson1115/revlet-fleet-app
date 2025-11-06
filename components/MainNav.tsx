"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Me = {
  role?: string | null;
  name?: string | null;
  email?: string | null;
};

type Permissions = {
  canSeeCreateRequest: boolean;
  canSeeOffice: boolean;
  canSeeDispatch: boolean;
  canSeeTech: boolean;
  canSeeAdmin: boolean;
  canSeeReports: boolean;
};

async function getMe(): Promise<{
  ok: boolean;
  authed: boolean;
  me: Me | null;
  permissions?: Permissions;
}> {
  try {
    const res = await fetch("/api/me", {
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) return { ok: false, authed: false, me: null };
    const json = await res.json();
    // Accept either flat or nested shapes
    const me: Me = json.me ?? json;
    const perms: Permissions | undefined = json.permissions;
    const authed = Boolean(json.ok ?? true);
    return { ok: true, authed, me, permissions: perms };
  } catch {
    return { ok: false, authed: false, me: null };
  }
}

async function postJSON(url: string) {
  await fetch(url, { method: "POST", credentials: "include" });
}

export default function MainNav() {
  const [me, setMe] = useState<Me | null>(null);
  const [authed, setAuthed] = useState(false);
  const [perms, setPerms] = useState<Permissions | null>(null);

  useEffect(() => {
    let live = true;
    (async () => {
      const r = await getMe();
      if (!live) return;
      setMe(r.me);
      setAuthed(r.authed);
      if (r.permissions) setPerms(r.permissions);
    })();
    return () => {
      live = false;
    };
  }, []);

  const role = String(me?.role || "VIEWER").toUpperCase();

  // If /api/me didn’t return permissions (older builds), derive minimal defaults from role.
  const derived: Permissions = perms ?? {
    canSeeCreateRequest: true,
    canSeeOffice: ["SUPERADMIN", "OFFICE", "DISPATCH"].includes(role),
    canSeeDispatch: ["SUPERADMIN", "DISPATCH", "OFFICE"].includes(role), // OFFICE can view; Dispatch mutates on page
    canSeeTech: ["SUPERADMIN", "TECH"].includes(role),
    canSeeAdmin: role === "SUPERADMIN",
    canSeeReports: ["SUPERADMIN", "OFFICE", "DISPATCH"].includes(role),
  };

  async function signOut() {
    try {
      await postJSON("/api/auth/logout");
    } catch {}
    window.location.href = "/";
  }

  return (
    <nav className="w-full border-b bg-white">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-semibold">
            Revlet Fleet
          </Link>

          {/* Order: Create Request / Office Queue / Dispatch / Tech / Admin / Reports */}
          {derived.canSeeCreateRequest && (
            <Link href="/fm/requests/new" className="text-sm hover:underline">
              Create Request
            </Link>
          )}

          {derived.canSeeOffice && (
            <Link href="/office" className="text-sm hover:underline">
              Office Queue
            </Link>
          )}

          {derived.canSeeDispatch && (
            <Link href="/tech/dispatch" className="text-sm hover:underline">
              Dispatch
            </Link>
          )}

          {derived.canSeeTech && (
            <Link href="/tech/my-jobs" className="text-sm hover:underline">
              Tech
            </Link>
          )}

          
          {derived.canSeeReports && (
            <Link href="/reports" className="text-sm hover:underline">
              Reports
            </Link>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-600">
          <div>{authed ? me?.email ?? me?.name ?? "User" : "Guest"} • {role}</div>
          {authed ? (
            <button onClick={signOut} className="border px-2 py-1 rounded">
              Sign out
            </button>
          ) : (
            <Link href="/auth" className="border px-2 py-1 rounded">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
