"use client";

import { useEffect, useState } from "react";

export default function HeaderUser() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;

    const load = async () => {
      const r = await fetch("/api/auth/session", { cache: "no-store" });
      const j = await r.json();
      if (!cancel) setData(j);
      setLoading(false);
    };

    load();
    return () => {
      cancel = true;
    };
  }, []);

  if (loading) return <div>Loading…</div>;

  if (!data?.profile)
    return (
      <a className="px-2 py-1 text-sm" href="/auth">
        Sign in
      </a>
    );

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm">
        {data?.profile?.name || data?.email} ({data?.role})
      </span>

      <form action="/api/auth/signout" method="post">
        <button className="text-xs border px-2 rounded">Sign out</button>
      </form>
    </div>
  );
}
