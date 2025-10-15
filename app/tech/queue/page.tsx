// app/tech/queue/page.tsx
"use client";

import { useEffect, useState } from "react";

type Row = { id: string; number?: string | null; status: string };

export default function TechQueuePage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/requests?status=IN_PROGRESS&limit=100", { cache: "no-store" });
      const data = await res.json();
      setRows(data.rows ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Tech Queue</h1>
      {loading ? <p>Loading…</p> : rows.length === 0 ? <p>No jobs.</p> : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.id} className="border rounded p-3 flex items-center justify-between">
              <div className="font-medium">#{r.number ?? r.id.slice(0,8)}</div>
              <button
                className="rounded px-3 py-1 border"
                onClick={async () => {
                  const res = await fetch(`/api/requests/${r.id}/complete`, { method: "PATCH" });
                  if (res.ok) setRows((old) => old.filter((x) => x.id !== r.id));
                }}
              >
                Complete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
