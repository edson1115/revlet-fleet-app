// app/reports/completed/page.tsx

"use client";

import { useEffect, useState, useMemo } from "react";
import { useLocationScope } from "@/lib/useLocationScope";

type Row = {
  id: string;
  status: string;
  service?: string | null;
  customer?: { id: string; name?: string | null } | null;
  vehicle?: {
    year?: number | null;
    make?: string | null;
    model?: string | null;
    unit_number?: string | null;
    plate?: string | null;
  } | null;
  location?: { id?: string; name?: string | null } | null;
  completed_at?: string | null;
  technician?: { id: string | null; name?: string | null } | null;
};

async function fetchJSON<T>(url: string) {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}

export default function ReportsCompletedPage() {
  // FIX: remove locationLabel
  const { locationId } = useLocationScope();

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const queryFragment = useMemo(() => {
    return locationId ? `&location_id=${encodeURIComponent(locationId)}` : "";
  }, [locationId]);

  useEffect(() => {
    let live = true;

    (async () => {
      try {
        const url =
          "/api/reports/completed?limit=200&sortBy=completed_at&sortDir=desc" +
          queryFragment;

        const data = await fetchJSON<{ rows: Row[] }>(url);
        if (!live) return;
        setRows(data.rows || []);
      } catch (e: any) {
        if (!live) return;
        setErr(e?.message || "Failed to load report");
      } finally {
        if (live) setLoading(false);
      }
    })();

    return () => {
      live = false;
    };
  }, [queryFragment]);

  function renderVehicle(v?: Row["vehicle"]) {
    if (!v) return "—";
    const parts: string[] = [];
    if (v.year) parts.push(String(v.year));
    if (v.make) parts.push(v.make || "");
    if (v.model) parts.push(v.model || "");
    const main = parts.join(" ").trim();

    if (main && v.unit_number) return `${main} (${v.unit_number})`;
    if (main) return main;
    if (v.unit_number) return v.unit_number;
    if (v.plate) return v.plate;
    return "—";
  }

  function fmtDate(s?: string | null) {
    if (!s) return "—";
    try {
      return new Date(s).toLocaleString();
    } catch {
      return s;
    }
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Completed Jobs</h1>

      {loading ? (
        <div>Loading…</div>
      ) : err ? (
        <div className="text-red-600">{err}</div>
      ) : rows.length === 0 ? (
        <div>No completed jobs found.</div>
      ) : (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left px-3 py-2">Customer</th>
              <th className="text-left px-3 py-2">Vehicle</th>
              <th className="text-left px-3 py-2">Service</th>
              <th className="text-left px-3 py-2">Completed</th>
              <th className="text-left px-3 py-2">Technician</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b hover:bg-gray-50">
                <td className="px-3 py-2">{r.customer?.name || "—"}</td>
                <td className="px-3 py-2">{renderVehicle(r.vehicle)}</td>
                <td className="px-3 py-2">{r.service || "—"}</td>
                <td className="px-3 py-2">{fmtDate(r.completed_at)}</td>
                <td className="px-3 py-2">
                  {r.technician?.name || r.technician?.id || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}



