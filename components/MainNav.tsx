"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  normalizeRole,
  permsFor,
  type Perms,
} from "@/lib/permissions";

type Me = {
  role?: string | null;
  name?: string | null;
  email?: string | null;
};

type MeResponse = {
  ok: boolean;
  authed: boolean;
  me: Me | null;
  permissions?: Partial<Perms>;
};

async function getMe(): Promise<MeResponse> {
  try {
    const res = await fetch("/api/me", {
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) return { ok: false, authed: false, me: null };
    const json = await res.json();

    const me: Me = json.me ?? json;
    const perms: Partial<Perms> | undefined = json.permissions;
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
  const [permsOverride, setPermsOverride] =
    useState<Partial<Perms> | null>(null);

  useEffect(() => {
    let live = true;
    (async () => {
      const r = await getMe();
      if (!live) return;
      setMe(r.me);
      setAuthed(r.authed);
      if (r.permissions) setPermsOverride(r.permissions);
    })();
    return () => {
      live = false;
    };
  }, []);

  const role = normalizeRole(me?.role || "VIEWER");

  // Base perms from role
  let perms: Perms = permsFor(role);

  // If backend ever sends tighter perms, merge them in
  if (permsOverride) {
    perms = { ...perms, ...permsOverride };
  }

  async function signOut() {
    try {
      await postJSON("/api/auth/logout");
    } catch {
      // ignore
    }
    window.location.href = "/?msg=signedout";
  }

  const label =
    authed
      ? me?.email || me?.name || "User"
      : "Guest";

  return (
    <nav className="w-full border-b bg-white">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Left: brand + links */}
        <div className="flex items-center gap-4">
          <Link href="/" className="font-semibold">
            Revlet Fleet
          </Link>

          {perms.canSeeCreateRequest && (
            <Link
              href="/fm/requests/new"
              className="text-sm hover:underline"
            >
              Create Request
            </Link>
          )}

          {perms.canSeeCustomerPortal && (
            <Link
              href="/customer"
              className="text-sm hover:underline"
            >
              My Portal
            </Link>
          )}

          {perms.canSeeOffice && (
            <Link
              href="/office"
              className="text-sm hover:underline"
            >
              Office Queue
            </Link>
          )}

          {perms.canSeeDispatch && (
            <Link
              href="/dispatch"
              className="text-sm hover:underline"
            >
              Dispatch
            </Link>
          )}

          {perms.canSeeTech && (
            <Link
              href="/tech"
              className="text-sm hover:underline"
            >
              Tech
            </Link>
          )}

          {perms.canSeeReports && (
            <Link
              href="/reports"
              className="text-sm hover:underline"
            >
              Reports
            </Link>
          )}
        </div>

        {/* Right: user info */}
        <div className="flex items-center gap-3 text-xs text-gray-600">
          <div>
            {label} • {role}
          </div>
          {authed ? (
            <button
              onClick={signOut}
              className="border px-2 py-1 rounded"
            >
              Sign out
            </button>
          ) : (
            <Link
              href="/login"
              className="border px-2 py-1 rounded"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
