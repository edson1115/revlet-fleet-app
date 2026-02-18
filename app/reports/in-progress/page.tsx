// app/reports/in-progress/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useLocationScope } from "@/lib/useLocationScope";

// ✅ FIX: Force dynamic rendering to bypass build-time Context errors (useLocationScope)
export const dynamic = "force-dynamic";

type Row = {
  id: string;
  status: string;
  created_at?: string;
  scheduled_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  service?: string | null;
  customer?: { id: string; name?: string | null } | null;
  vehicle?: {
    id: string;
    year?: number | null;
    make?: string | null;
    model?: string | null;
    plate?: string | null;
    unit_number?: string | null;
  } | null;
  location?: { id: string; name?: string | null } | null;
  technician?: { id: string; name?: string | null; full_name?: string | null } | null;
};

async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "include", cache: "no-store" });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return (await res.json()) as T;
}

function fmt(dt?: string | null) {
  if (!dt) return "—";
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return dt;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function elapsed(start?: string | null) {
  if (!start) return "—";
  const d = new Date(start);
  const diff = Date.now() - d.getTime();
  if (diff < 0) return "—";

  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;

  const hours = Math.floor(mins / 60);
  const rem = mins % 60;
  return `${hours}h ${rem}m`;
}

export default function InProgressPage() {
  // This hook will now safely run at runtime in the browser
  const { locationId } = useLocationScope();

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [filterTech, setFilterTech] = useState("");
  const [filterCustomer, setFilterCustomer] = useState("");

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const qs = new URLSearchParams();
      qs.set("status", "IN_PROGRESS");
      qs.set("sortBy", "started_at");
      qs.set("sortDir", "asc");
      if (locationId) qs.set("location_id", locationId);

      const out = await getJSON<{ rows: Row[] }>(`/api/requests?${qs.toString()}`);

      setRows(out?.rows || []);
    } catch (e: any) {
      setErr(e?.message || "Failed to load");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [locationId]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const okTech =
        !filterTech ||
        (r.technician?.full_name || r.technician?.name || "")
          .toLowerCase()
          .includes(filterTech.toLowerCase());

      const okCust =
        !filterCustomer ||
        (r.customer?.name || "").toLowerCase().includes(filterCustomer.toLowerCase());

      return okTech && okCust;
    });
  }, [rows, filterTech, filterCustomer]);

  // summary tiles
  const tileTotal = filtered.length;
  const tileAvgTime = (() => {
    if (!filtered.length) return "—";
    const mins = filtered
      .map((r) => {
        if (!r.started_at) return 0;
        return Math.floor((Date.now() - new Date(r.started_at).getTime()) / 60000);
      })
      .filter((m) => m > 0);
    if (!mins.length) return "—";
    const avg = Math.round(mins.reduce((a, b) => a + b) / mins.length);
    if (avg < 60) return `${avg}m`;
    const h = Math.floor(avg / 60);
    const m = avg % 60;
    return `${h}h ${m}m`;
  })();

  const tileTechs = new Set(
    filtered
      .map((r) =>
        r.technician?.full_name ||
        r.technician?.name ||
        null
      )
      .filter(Boolean)
  ).size;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">In-Progress Jobs</h1>
        <button
          onClick={load}
          className="border rounded-lg px-3 py-2 text-sm hover:bg-gray-50"
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </header>

      {/* SUMMARY TILES */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border p-4 bg-white">
          <div className="text-xs text-gray-500">Total In Progress</div>
          <div className="text-2xl font-semibold mt-1">{tileTotal}</div>
        </div>

        <div className="rounded-xl border p-4 bg-white">
          <div className="text-xs text-gray-500">Avg Time Elapsed</div>
          <div className="text-2xl font-semibold mt-1">{tileAvgTime}</div>
        </div>

        <div className="rounded-xl border p-4 bg-white">
          <div className="text-xs text-gray-500">Techs Working</div>
          <div className="text-2xl font-semibold mt-1">{tileTechs}</div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="rounded-xl border p-4 bg-white">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="text-xs text-gray-600 block mb-1">Filter by Technician</label>
            <input
              className="border rounded-lg px-3 py-2 text-sm"
              placeholder="Type technician name…"
              value={filterTech}
              onChange={(e) => setFilterTech(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs text-gray-600 block mb-1">Filter by Customer</label>
            <input
              className="border rounded-lg px-3 py-2 text-sm"
              placeholder="Type customer…"
              value={filterCustomer}
              onChange={(e) => setFilterCustomer(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ERROR */}
      {err && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {err}
        </div>
      )}

      {/* TABLE */}
      <div className="rounded-xl border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b text-xs uppercase text-gray-600">
            <tr>
              <th className="px-4 py-2 text-left">Technician</th>
              <th className="px-4 py-2 text-left">Customer</th>
              <th className="px-4 py-2 text-left">Vehicle</th>
              <th className="px-4 py-2 text-left">Service</th>
              <th className="px-4 py-2 text-left">Started</th>
              <th className="px-4 py-2 text-left">Elapsed</th>
              <th className="px-4 py-2 text-left">Location</th>
              <th className="px-4 py-2 text-left"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-gray-500">
                  No in-progress jobs.
                </td>
              </tr>
            )}

            {filtered.map((r) => {
              const tech =
                r.technician?.full_name ||
                r.technician?.name ||
                "—";

              const veh = r.vehicle
                ? [
                    r.vehicle.unit_number && `#${r.vehicle.unit_number}`,
                    r.vehicle.year,
                    r.vehicle.make,
                    r.vehicle.model,
                    r.vehicle.plate && `(${r.vehicle.plate})`,
                  ]
                    .filter(Boolean)
                    .join(" ")
                : "—";

              return (
                <tr key={r.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2">{tech}</td>
                  <td className="px-4 py-2">{r.customer?.name || "—"}</td>
                  <td className="px-4 py-2">{veh}</td>
                  <td className="px-4 py-2">{r.service || "—"}</td>
                  <td className="px-4 py-2">{fmt(r.started_at)}</td>
                  <td className="px-4 py-2">{elapsed(r.started_at)}</td>
                  <td className="px-4 py-2">{r.location?.name || "—"}</td>
                  <td className="px-4 py-2">
                    <Link
                      href={`/fm/requests/${r.id}`}
                      className="text-blue-600 underline text-xs"
                    >
                      Details
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}