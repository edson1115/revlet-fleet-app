"use client";

import { useEffect, useState } from "react";
import { useLocationScope } from "@/lib/useLocationScope";

type PickLocation = { id: string; name: string };

export default function LocationSwitcher() {
  const { locationId, setLocationId, clear } = useLocationScope();
  const [opts, setOpts] = useState<PickLocation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let live = true;
    (async () => {
      setLoading(true);
      try {
        // your lookups endpoint already exists
        const r = await fetch("/api/lookups?type=locations", { credentials: "include" });
        const js = await r.json();
        const rows: PickLocation[] = js?.rows ?? js?.data ?? [];
        if (live) setOpts(rows);
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  return (
    <div className="flex items-center gap-2">
      <select
        value={locationId ?? ""}
        onChange={(e) => {
          const v = e.target.value;
          if (!v) clear();
          else setLocationId(v);
        }}
        className="border rounded px-2 py-1 text-xs"
        title="Scope queues by location"
      >
        <option value="">All locations</option>
        {opts.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
      {loading ? <span className="text-[11px] text-gray-500">loading…</span> : null}
    </div>
  );
}
