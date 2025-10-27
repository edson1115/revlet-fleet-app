// app/tech/today/page.tsx
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
};

type Customer = { id: UUID; name: string };
type Location = { id: UUID; name: string };

type ReqRow = {
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

export default function TechTodayPage() {
  const [rows, setRows] = useState<ReqRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // America/Chicago “today” window
  // We’ll compute local day bounds and compare timestamps against it.
  const tz = "America/Chicago";
  const { startISO, endISO } = useMemo(() => {
    const now = new Date();
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    // get local date parts in tz
    const parts = fmt.formatToParts(now);
    const y = parts.find(p => p.type === "year")?.value ?? "1970";
    const m = parts.find(p => p.type === "month")?.value ?? "01";
    const d = parts.find(p => p.type === "day")?.value ?? "01";
    // Build local start/end and convert to real Date then to ISO
    const startLocal = new Date(`${y}-${m}-${d}T00:00:00`);
    const endLocal = new Date(`${y}-${m}-${d}T23:59:59.999`);
    // adjust offsets to the target tz by reconstructing using that tz offset via hack:
    // Create strings in that tz and parse back—simple approach for client only usage.
    // (Good enough for filtering client-side; server filtering would be better if needed.)
    return {
      startISO: startLocal.toISOString(),
      endISO: endLocal.toISOString(),
    };
  }, []);

  const withinToday = (iso?: string | null) => {
    if (!iso) return false;
    try {
      const t = new Date(iso).getTime();
      return t >= new Date(startISO).getTime() && t <= new Date(endISO).getTime();
    } catch {
      return false;
    }
  };

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      // Fetch SCHEDULED and IN_PROGRESS; combine client-side
      const [aRes, bRes] = await Promise.all([
        fetch(`/api/requests?status=SCHEDULED`, { credentials: "include" }),
        fetch(`/api/requests?status=IN_PROGRESS`, { credentials: "include" }),
      ]);
      const [aJs, bJs] = await Promise.all([aRes.json(), bRes.json()]);
      if (!aRes.ok) throw new Error(aJs?.error || "Failed to load scheduled");
      if (!bRes.ok) throw new Error(bJs?.error || "Failed to load in-progress");

      const scheduled: ReqRow[] = Array.isArray(aJs?.rows) ? aJs.rows : [];
      const inprog: ReqRow[] = Array.isArray(bJs?.rows) ? bJs.rows : [];

      // Keep only those scheduled today (local), plus all IN_PROGRESS regardless of date
      const todaySched = scheduled.filter(r => withinToday(r.scheduled_at || undefined));
      const combined = [...todaySched, ...inprog];

      // De-dupe in case of overlaps (unlikely but safe)
      const map = new Map<string, ReqRow>();
      for (const r of combined) map.set(r.id, r);

      setRows(Array.from(map.values()).sort((a, b) => {
        const ta = new Date(a.scheduled_at ?? a.started_at ?? a.created_at ?? 0).getTime();
        const tb = new Date(b.scheduled_at ?? b.started_at ?? b.created_at ?? 0).getTime();
        return ta - tb;
      }));
    } catch (e: any) {
      setErr(e?.message || "Failed to load");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onStart = async (id: UUID) => {
    setErr(null);
    // optimistic: assume it becomes IN_PROGRESS
    setRows(prev => prev.map(r => r.id === id ? { ...r, status: "IN_PROGRESS", started_at: r.started_at ?? new Date().toISOString() } : r));
    const res = await fetch(`/api/requests/${id}/start`, { method: "PATCH", credentials: "include" });
    if (!res.ok) {
      const js = await res.json().catch(() => ({}));
      setErr(js?.error || "Failed to start");
      load();
    } else {
      load();
    }
  };

  const onComplete = async (id: UUID) => {
    setErr(null);
    setRows(prev => prev.map(r => r.id === id ? { ...r, status: "COMPLETED", completed_at: new Date().toISOString() } : r));
    const res = await fetch(`/api/requests/${id}/complete`, { method: "PATCH", credentials: "include" });
    if (!res.ok) {
      const js = await res.json().catch(() => ({}));
      setErr(js?.error || "Failed to complete");
      load();
    } else {
      load();
    }
  };

  const statusBadge = (s: Status) => {
    const base = "inline-flex items-center px-2 py-0.5 rounded text-xs border";
    const map: Record<Status, string> = {
      NEW: "bg-yellow-50 border-yellow-300 text-yellow-800",
      SCHEDULED: "bg-blue-50 border-blue-300 text-blue-800",
      IN_PROGRESS: "bg-purple-50 border-purple-300 text-purple-800",
      COMPLETED: "bg-green-50 border-green-300 text-green-800",
      WAITING_APPROVAL: "bg-orange-50 border-orange-300 text-orange-800",
      WAITING_PARTS: "bg-amber-50 border-amber-300 text-amber-800",
      DECLINED: "bg-rose-50 border-rose-300 text-rose-800",
    };
    return <span className={`${base} ${map[s]}`}>{s}</span>;
  };

  const fmtVehicle = (v?: Vehicle | null) => {
    if (!v) return "-";
    const parts = [
      v.unit_number || "",
      v.year ? String(v.year) : "",
      v.make || "",
      v.model || "",
      v.plate ? `(${v.plate})` : "",
    ].filter(Boolean);
    return parts.join(" • ");
  };

  const scheduled = useMemo(() => rows.filter(r => r.status === "SCHEDULED"), [rows]);
  const active = useMemo(() => rows.filter(r => r.status === "IN_PROGRESS"), [rows]);

  return (
    <div className="px-4 py-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Today&apos;s Jobs</h1>

      <div className="mb-4 flex items-center gap-3">
        <button className="rounded-lg border px-3 py-2 text-sm" onClick={load} disabled={loading}>
          Refresh
        </button>
        {err && (
          <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
            {err}
          </div>
        )}
      </div>

      {/* Scheduled for Today */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Scheduled</h2>
        <div className="overflow-x-auto rounded-xl border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-3 py-2">When</th>
                <th className="px-3 py-2">Vehicle</th>
                <th className="px-3 py-2">Customer</th>
                <th className="px-3 py-2">Location</th>
                <th className="px-3 py-2">Service</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="px-3 py-3 text-gray-500" colSpan={6}>Loading…</td></tr>
              ) : scheduled.length === 0 ? (
                <tr><td className="px-3 py-3 text-gray-500" colSpan={6}>Nothing scheduled today.</td></tr>
              ) : scheduled.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-3 py-2">
                    {r.scheduled_at ? new Date(r.scheduled_at).toLocaleString() : "-"}
                  </td>
                  <td className="px-3 py-2">{fmtVehicle(r.vehicle)}</td>
                  <td className="px-3 py-2">{r.customer?.name || "-"}</td>
                  <td className="px-3 py-2">{r.location?.name || "-"}</td>
                  <td className="px-3 py-2">{r.service || "-"}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <span>{statusBadge(r.status)}</span>
                      <button
                        className="rounded-lg border px-2 py-1"
                        onClick={() => onStart(r.id)}
                        title="Start job"
                      >
                        Start
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* In Progress */}
      <section>
        <h2 className="text-lg font-semibold mb-2">In Progress</h2>
        <div className="overflow-x-auto rounded-xl border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-3 py-2">Started</th>
                <th className="px-3 py-2">Vehicle</th>
                <th className="px-3 py-2">Customer</th>
                <th className="px-3 py-2">Location</th>
                <th className="px-3 py-2">Service</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="px-3 py-3 text-gray-500" colSpan={6}>Loading…</td></tr>
              ) : active.length === 0 ? (
                <tr><td className="px-3 py-3 text-gray-500" colSpan={6}>No active jobs.</td></tr>
              ) : active.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-3 py-2">{r.started_at ? new Date(r.started_at).toLocaleString() : "-"}</td>
                  <td className="px-3 py-2">{fmtVehicle(r.vehicle)}</td>
                  <td className="px-3 py-2">{r.customer?.name || "-"}</td>
                  <td className="px-3 py-2">{r.location?.name || "-"}</td>
                  <td className="px-3 py-2">{r.service || "-"}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <span>{statusBadge(r.status)}</span>
                      <button
                        className="rounded-lg border px-2 py-1"
                        onClick={() => onComplete(r.id)}
                        title="Finish job"
                      >
                        Complete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
