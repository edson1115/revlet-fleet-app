"use client";

import { useEffect, useState } from "react";

type Me = {
  id?: string | null;
  role?: string | null;
  company_id?: string | null;
  customer_id?: string | null;
  name?: string | null;
  email?: string | null;
  error?: string;
};

export default function UserChip() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const res = await fetch("/api/me", {
          credentials: "include",
          cache: "no-store",
        });
        const j = (await res.json()) as Me;
        if (!cancel) setMe(j);
      } catch {
        if (!cancel) setMe({ error: "unavailable" });
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  if (loading) return <span className="text-xs text-gray-500">Checking…</span>;

  const role = (me?.role ?? "").toUpperCase();
  const signedIn = !!me?.id;

  return (
    <div className="flex items-center gap-2">
      {signedIn ? (
        <>
          <span className="text-sm">
            {me?.name || me?.email || "User"}{" "}
            <span className="text-gray-500">({role || "UNKNOWN"})</span>
          </span>

          <form action="/api/auth/signout" method="post">
            <button className="text-sm px-2 py-1 border rounded" type="submit">
              Sign out 
            </button>
          </form>
        </>
      ) : (
        <a className="text-sm px-2 py-1 border rounded" href="/login">
          Sign in
        </a>
      )}
    </div> // ✅ PROPER CLOSING TAG
  );
}



