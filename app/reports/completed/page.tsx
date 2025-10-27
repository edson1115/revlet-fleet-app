// app/reports/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type UUID = string;
type Status = "NEW" | "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "WAITING_APPROVAL" | "WAITING_PARTS" | "DECLINED";

type Vehicle = {
  id: UUID;
  unit_number?: string | null;
  year?: number | null;
  make?: string | null;
  model?: string | null;
  plate?: string | null;
  vin?: string | null;
};
type Customer = { id: UUID; name: string };
type Location = { id: UUID; name: string };

type Row = {
  id: UUID;
  status: Status;
  created_at?: string;
  scheduled_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  service?: string | null;
  fmc?: string | null;
  mileage?: number | null;
  po?: string | null;
  notes?: string | null;
  vehicle?: Vehicle | null;
  customer?: Customer | null;
  location?: Location | null;
};

const ALL_STATUSES: Status[] = ["NEW","SCHEDULED","IN_PROGRESS","COMPLETED","WAITING_APPROVAL","WAITING_PARTS","DECLINED"];

export default function ReportsPage() {
  // defaults: last 14 days, COMPLETED
  const [start, setStart] = useState<string>(() => {
    const d = new Date(); d.setDate(d.getDate() - 14); return d.toISOString().slice(0,10);
  });
  const [end, setEnd] = useState<string>(() => new Date().toISOString().slice(0,10));
  const [statuses, setStatuses] = useState<Status[]>(["COMPLETED"]);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    if (start) p.set("start", start);
    if (end) p.set("end", end);
    for (const s of statuses) p.append("status", s);
    return p.toString();
  }, [start, end, statuses]);

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/reports/requests?${qs}`, { credentials: "include" });
      const js = await res.json();
      if (!res.ok) throw new Error(js?.error || "Failed to load");
      setRows(Array.isArray(js?.rows) ? js.rows : []);
    } catch (e: any) {
      setErr(e?.message || "Failed to load");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [qs]);

  const toggleStatus = (s: Status) => {
    setStatuses((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  const exportCsvHref = `/api/reports/requests?${qs}&format=csv`;

  const fmtVehicle = (v?: Vehicle | null) => {
    if (!v) return "—";
    const parts = [v.unit_number, v.year, v.make, v.model, v.plate ? `(${v.plate})` : ""].filter(Boolean).map(String);
    return parts.join(" • ");
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-semibold">Reports</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Start date</label>
          <input type="date" className="w-full rounded-lg border px-3 py-2" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">End date</label>
          <input type="date" className="w-full rounded-lg border px-3 py-2" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Statuses</label>
          <div className="flex flex-wrap gap-2">
            {ALL_STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => toggleStatus(s)}
                className={`rounded-lg border px-3 py-1 text-sm ${statuses.includes(s) ? "bg-black text-white" : ""}`}
                title="Toggle"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="rounded-lg border px-3 py-2 text-sm" onClick={load} disabled={loading}>Refresh</button>
        <a className="rounded-lg border px-3 py-2 text-sm" href={exportCsvHref}>Export CSV</a>
        {err && <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}
      </div>

      <div className="overflow-x-auto border rounded">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">Created</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Scheduled</th>
              <th className="text-left p-3">Started</th>
              <th className="text-left p-3">Completed</th>
              <th className="text-left p-3">Customer</th>
              <th className="text-left p-3">Location</th>
              <th className="text-left p-3">Vehicle</th>
              <th className="text-left p-3">Service</th>
              <th className="text-left p-3">FMC</th>
              <th className="text-left p-3">PO</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-6 text-gray-500" colSpan={11}>Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td className="p-6 text-gray-500" colSpan={11}>No data.</td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-3">{r.created_at ? new Date(r.created_at).toLocaleString() : "—"}</td>
                  <td className="p-3">{r.status}</td>
                  <td className="p-3">{r.scheduled_at ? new Date(r.scheduled_at).toLocaleString() : "—"}</td>
                  <td className="p-3">{r.started_at ? new Date(r.started_at).toLocaleString() : "—"}</td>
                  <td className="p-3">{r.completed_at ? new Date(r.completed_at).toLocaleString() : "—"}</td>
                  <td className="p-3">{r.customer?.name ?? "—"}</td>
                  <td className="p-3">{r.location?.name ?? "—"}</td>
                  <td className="p-3">{fmtVehicle(r.vehicle)}</td>
                  <td className="p-3">{r.service ?? "—"}</td>
                  <td className="p-3">{r.fmc ?? "—"}</td>
                  <td className="p-3">{r.po ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
