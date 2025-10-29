// app/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Me = {
  id: string;
  role: string | null;
  name: string | null;
  email: string | null;
};

export default function HomePage() {
  const [me, setMe] = useState<Me | null>(null);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/me", { credentials: "include", cache: "no-store" });
        if (res.status === 401) {
          setAuthed(false);
          setMe(null);
          return;
        }
        const j = await res.json();
        setMe(j);
        setAuthed(true);
      } catch {
        setAuthed(false);
        setMe(null);
      }
    })();
  }, []);

  const role = String(me?.role || "").toUpperCase();

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Revlet Fleet</h1>

      {authed ? (
        <div className="rounded border p-3 bg-green-50">
          You are signed in{role ? ` with role ${role}` : ""}.
        </div>
      ) : (
        <div className="rounded border p-3 bg-amber-50">
          You are not signed in. <Link className="underline" href="/auth">Sign in</Link>
        </div>
      )}

      <div className="grid gap-3">
        <Link className="underline" href="/customer/requests/new">Create Request (Customer)</Link>
        <Link className="underline" href="/office/queue">Office Queue</Link>
        <Link className="underline" href="/reports">Reports</Link>
        <Link className="underline" href="/admin">Admin</Link>
      </div>
    </main>
  );
}
