'use client';

import { useEffect, useState } from "react";
import Link from "next/link";

type Me = { role?: string | null; name?: string | null; email?: string | null };

async function getMe(): Promise<{ me: Me | null; authed: boolean }> {
  try {
    const res = await fetch("/api/me", { credentials: "include" });
    if (res.status === 401) return { me: null, authed: false };
    if (!res.ok) throw new Error(String(res.status));
    return { me: await res.json(), authed: true };
  } catch {
    return { me: null, authed: false };
  }
}

async function postJSON(url: string) {
  await fetch(url, { method: "POST", credentials: "include" });
}

export default function MainNav() {
  const [me, setMe] = useState<Me | null>(null);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    let live = true;
    (async () => {
      const { me, authed } = await getMe();
      if (!live) return;
      setMe(me);
      setAuthed(authed);
    })();
    return () => { live = false; };
  }, []);

  const role = String(me?.role || "CUSTOMER").toUpperCase();
  const isCustomer = role === "CUSTOMER";
  const isOffice = role === "OFFICE";
  const isDispatcher = role === "DISPATCHER";
  const isTech = role === "TECH" || role === "TECHNICIAN";

  async function signOut() {
    try { await postJSON("/api/auth/logout"); } catch {}
    window.location.href = "/";
  }

  return (
    <nav className="w-full border-b bg-white">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-semibold">Revlet</Link>

          {isCustomer && (
            <>
              <Link href="/customer/requests" className="text-sm hover:underline">My Requests</Link>
              <Link href="/customer/requests/new" className="text-sm hover:underline">Create Request</Link>
            </>
          )}

          {(isOffice || isDispatcher || isTech) && (
            <>
              <Link href="/office/queue" className="text-sm hover:underline">Office Queue</Link>
              <Link href="/reports" className="text-sm hover:underline">Reports</Link>
            </>
          )}

          {isDispatcher && (
            <Link href="/tech/dispatch" className="text-sm hover:underline">Dispatch</Link>
          )}

          {isTech && (
            <Link href="/tech/my-jobs" className="text-sm hover:underline">My Jobs</Link>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-600">
          <div>{authed ? (me?.name ?? me?.email ?? "User") : "Guest"} • {role}</div>
          {authed ? (
            <button onClick={signOut} className="border px-2 py-1 rounded">Sign out</button>
          ) : (
            // replace with your auth page/route
            <Link href="/auth" className="border px-2 py-1 rounded">Sign in</Link>
          )}
        </div>
      </div>
    </nav>
  );
}
