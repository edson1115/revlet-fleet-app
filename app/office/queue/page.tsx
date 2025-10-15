// app/office/queue/page.tsx
"use client";

import { useEffect, useState } from "react";

type RequestRow = {
  id: string;
  number?: string | null;
  status: "NEW" | "SCHEDULED" | "IN_PROGRESS" | "COMPLETED";
  vehicle_id?: string | null;
  customer_name?: string | null;
  created_at?: string | null;
};

export default function OfficeQueuePage() {
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/requests?status=NEW&limit=100", { cache: "no-store" });
        if (!res.ok) throw new Error(`GET /api/requests failed ${res.status}`);
        const data = await res.json();
        if (mounted) setRows(data.rows ?? []);
      } catch (e: any) {
        if (mounted) setErr(e.message ?? "Load failed");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Office — NEW</h1>
      {loading && <p>Loading…</p>}
      {err && <p className="text-red-600">{err}</p>}
      {!loading && !err && rows.length === 0 && <p>No new requests.</p>}
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.id} className="border rounded p-3 flex items-center justify-between">
            <div>
              <div className="font-medium">#{r.number ?? r.id.slice(0,8)}</div>
              <div className="text-sm text-gray-600">
                {r.customer_name ?? "Customer"} • Vehicle {r.vehicle_id ?? "—"}
              </div>
            </div>
            <form
              onSubmit={async (ev) => {
                ev.preventDefault();
                const res = await fetch(`/api/requests/${r.id}/schedule`, { method: "PATCH" });
                if (res.ok) {
                  setRows((old) => old.filter((x) => x.id !== r.id));
                } else {
                  alert("Schedule failed");
                }
              }}
            >
              <button className="rounded px-3 py-1 border">Schedule now</button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
