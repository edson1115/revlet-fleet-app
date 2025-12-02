// app/dispatch/scheduled/ui/ScheduledClient.tsx
"use client";

import { useEffect, useState } from "react";

type Id = string;

type Row = {
  id: Id;
  status: "SCHEDULED";
  created_at: string;
  scheduled_at: string | null;
  service: string | null;
  po: string | null;
  notes: string | null;
  // request_techs could be missing/null if column doesn't exist; treat as optional
  request_techs?: string[] | null;
  customer?: { name?: string | null; market?: string | null } | null;
  vehicle?: { year?: number | null; make?: string | null; model?: string | null; plate?: string | null; unit_number?: string | null } | null;
};

type Tech = { id: Id; name: string };

async function getJSON<T>(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as T;
}

export default function ScheduledClient() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>("");
  const [techIndex, setTechIndex] = useState<Record<string, string>>({});
  const [acting, setActing] = useState<Id | null>(null);

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const list = await getJSON<Row[]>(`/api/requests?status=SCHEDULED`);
      setRows(list ?? []);

      const techs = await getJSON<{ techs: Tech[] }>(`/api/lookups?scope=techs`).catch(() => ({ techs: [] as Tech[] }));
      const idx: Record<string, string> = {};
      (techs.techs || []).forEach(t => { idx[t.id] = t.name; });
      setTechIndex(idx);
    } catch (e: any) {
      setErr(e?.message || "Failed to load scheduled jobs");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function vehicleLabel(r: Row) {
    const v = r.vehicle || {};
    return [v.year, v.make, v.model, v.plate || v.unit_number].filter(Boolean).join(" ");
  }

  function canStart(r: Row) {
    if (!r.scheduled_at) return true;
    const now = Date.now();
    const sched = new Date(r.scheduled_at).getTime();
    return now >= sched;
  }

  async function markInProgress(id: Id) {
    setActing(id);
    try {
      const res = await fetch(`/api/requests/${id}/start`, { method: "PATCH" });
      const t = await res.text();
      if (!res.ok) throw new Error(t || "Failed to start");
      await load();
    } catch (e: any) {
      alert(e?.message || "Failed to mark in progress");
    } finally {
      setActing(null);
    }
  }

  return (
    <div className="space-y-4">
      {err && <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-700">{err}</div>}

      <div className="overflow-x-auto border rounded">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">Created</th>
              <th className="text-left p-3">Scheduled</th>
              <th className="text-left p-3">Customer</th>
              <th className="text-left p-3">Vehicle</th>
              <th className="text-left p-3">Service</th>
              <th className="text-left p-3">Technicians</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="p-6 text-center text-gray-500">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={7} className="p-6 text-center text-gray-500">No scheduled jobs</td></tr>
            ) : (
              rows.map(r => {
                const techIds = Array.isArray(r.request_techs) ? r.request_techs : [];
                const techLabels = techIds.map(tid => techIndex[tid] || tid);
                const schedTxt = r.scheduled_at ? new Date(r.scheduled_at).toLocaleString() : "—";
                const startEnabled = canStart(r);

                return (
                  <tr key={r.id} className="border-t align-top">
                    <td className="p-3">{new Date(r.created_at).toLocaleString()}</td>
                    <td className="p-3">{schedTxt}</td>
                    <td className="p-3">{r.customer?.name ?? "—"}</td>
                    <td className="p-3">{vehicleLabel(r) || "—"}</td>
                    <td className="p-3">{r.service ?? "—"}</td>
                    <td className="p-3">
                      {techLabels.length ? techLabels.join(", ") : <span className="text-gray-500">None</span>}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <a
                          href={`/dispatch/assign?id=${encodeURIComponent(r.id)}`}
                          className="rounded-lg border px-2 py-1 hover:bg-gray-50"
                          title="Re-Assign"
                        >
                          Re-Assign
                        </a>
                        <button
                          onClick={() => markInProgress(r.id)}
                          disabled={!startEnabled || acting === r.id}
                          className={`rounded-lg px-2 py-1 text-white ${startEnabled ? "bg-black" : "bg-gray-400"} disabled:opacity-60`}
                          title={startEnabled ? "Mark In Progress" : "Disabled until scheduled time"}
                        >
                          {acting === r.id ? "…" : "Mark In Progress"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
