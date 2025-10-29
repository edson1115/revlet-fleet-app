// app/dispatch/queue/page.tsx
'use client';

import { useEffect, useMemo, useState } from "react";

type Row = {
  id: string;
  status: string;
  service?: string | null;
  po?: string | null;
  notes?: string | null;
  created_at: string;
  scheduled_at?: string | null;
  customer?: { name?: string | null } | null;
  vehicle?: { year?: number | null; make?: string | null; model?: string | null; plate?: string | null; unit_number?: string | null } | null;
  location?: { name?: string | null } | null;
  technician?: { id?: string | null } | null;
};

type Tech = { id: string; name?: string | null };

async function getJSON<T>(url: string) {
  const res = await fetch(url, { credentials: "include", cache: "no-store" });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as T;
}
async function patchJSON<T>(url: string, body: any) {
  const res = await fetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), credentials: "include" });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as T;
}

function vehLabel(r: Row) {
  const v = r.vehicle || {};
  return [v.year, v.make, v.model, v.plate || v.unit_number].filter(Boolean).join(" ");
}
function fmtDate(s?: string | null) {
  if (!s) return "—";
  try { return new Date(s).toLocaleString(); } catch { return s!; }
}

export default function DispatchQueuePage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [techs, setTechs] = useState<Tech[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [busyId, setBusyId] = useState<string | null>(null);
  const [when, setWhen] = useState<Record<string, string>>({});     // id -> datetime-local
  const [who, setWho] = useState<Record<string, string>>({});       // id -> technician_id

  async function load() {
    setLoading(true);
    setErr("");
    try {
      // Load requests that need dispatch attention
      const list = await getJSON<{ rows: Row[] }>("/api/requests?limit=100&sortBy=created_at&sortDir=desc");
      // Filter to statuses dispatcher usually handles
      const filtered = (list.rows || []).filter(r =>
        ["WAITING_TO_BE_SCHEDULED", "WAITING_APPROVAL", "WAITING_PARTS", "NEW", "SCHEDULED"].includes(r.status)
      );
      setRows(filtered);

      // Load technicians
      const t = await getJSON<{ ok: boolean; data: Tech[] }>("/api/lookups?scope=technicians");
      setTechs((t.ok ? t.data : []) || []);
    } catch (e: any) {
      setErr(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const visible = useMemo(() => rows, [rows]);

  async function saveSchedule(r: Row) {
    setBusyId(r.id);
    setErr("");
    try {
      const dt = when[r.id] ? new Date(when[r.id]).toISOString() : null;
      await patchJSON(`/api/requests/${r.id}`, { scheduled_at: dt, status: dt ? "SCHEDULED" : r.status });
      await load();
    } catch (e: any) {
      setErr(e?.message || "Failed to save schedule");
    } finally {
      setBusyId(null);
    }
  }

  async function assignTech(r: Row) {
    setBusyId(r.id);
    setErr("");
    try {
      const techId = who[r.id] || null;
      await patchJSON(`/api/requests/${r.id}/technician`, { technician_id: techId });
      // If scheduled date is set and a tech is chosen, mark as SCHEDULED IN SESSION (your wording)
      if (techId && when[r.id]) {
        await patchJSON(`/api/requests/${r.id}`, { status: "SCHEDULED" });
      }
      await load();
    } catch (e: any) {
      setErr(e?.message || "Failed to assign technician");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Dispatch Queue</h1>
        <div className="text-sm text-gray-500">Schedule date & assign technician</div>
      </div>

      {err ? <div className="border border-red-200 bg-red-50 text-red-700 p-2 rounded text-sm">{err}</div> : null}

      <div className="overflow-x-auto border rounded">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">Created</th>
              <th className="text-left p-3">Customer</th>
              <th className="text-left p-3">Vehicle</th>
              <th className="text-left p-3">Service</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Scheduled For</th>
              <th className="text-left p-3">Technician</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="p-6 text-center text-gray-500">Loading…</td></tr>
            ) : visible.length === 0 ? (
              <tr><td colSpan={8} className="p-6 text-center text-gray-500">Nothing to dispatch.</td></tr>
            ) : visible.map((r) => (
              <tr key={r.id} className="border-t align-top">
                <td className="p-3">
                  <div>{fmtDate(r.created_at)}</div>
                  {r.location?.name ? <div className="text-xs text-gray-500">{r.location.name}</div> : null}
                </td>
                <td className="p-3">{r.customer?.name ?? "—"}</td>
                <td className="p-3">{vehLabel(r) || "—"}</td>
                <td className="p-3">{r.service ?? "—"}</td>
                <td className="p-3">{r.status}</td>
                <td className="p-3">
                  <input
                    type="datetime-local"
                    defaultValue={r.scheduled_at ? new Date(r.scheduled_at).toISOString().slice(0,16) : ""}
                    onChange={(e) => setWhen((m) => ({ ...m, [r.id]: e.currentTarget.value }))}
                    className="rounded border px-2 py-1"
                    disabled={busyId === r.id}
                  />
                  {r.scheduled_at ? (
                    <div className="text-xs text-gray-500 mt-1">Now: {fmtDate(r.scheduled_at)}</div>
                  ) : null}
                </td>
                <td className="p-3">
                  <select
                    className="rounded border px-2 py-1 min-w-40"
                    defaultValue={r.technician?.id ?? ""}
                    onChange={(e) => setWho((m) => ({ ...m, [r.id]: e.currentTarget.value }))}
                    disabled={busyId === r.id}
                  >
                    <option value="">Unassigned</option>
                    {techs.map(t => <option key={t.id} value={t.id}>{t.name || t.id}</option>)}
                  </select>
                </td>
                <td className="p-3 space-x-2">
                  <button
                    onClick={() => saveSchedule(r)}
                    className="px-2 py-1 border rounded disabled:opacity-50"
                    disabled={busyId === r.id}
                  >
                    Save Date
                  </button>
                  <button
                    onClick={() => assignTech(r)}
                    className="px-2 py-1 border rounded disabled:opacity-50"
                    disabled={busyId === r.id}
                  >
                    Assign Tech
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
