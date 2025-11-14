// app/reports/completed/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useLocationScope } from "@/lib/useLocationScope";

type UUID = string;

type Vehicle =
  | {
      id: UUID;
      unit_number?: string | null;
      year?: number | null;
      make?: string | null;
      model?: string | null;
      plate?: string | null;
    }
  | null;

type Row = {
  id: UUID;
  status: string;
  service?: string | null;
  completed_at?: string | null;
  created_at?: string | null;
  scheduled_at?: string | null;
  customer?: { id: string; name?: string | null } | null;
  location?: { id: string; name?: string | null } | null;
  vehicle?: Vehicle;
};

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "include", cache: "no-store" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText}${text ? ` – ${text}` : ""}`);
  }
  return res.json() as Promise<T>;
}

function fmtDateTime(dt?: string | null) {
  if (!dt) return "—";
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return dt || "—";
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function renderVehicle(v?: Vehicle) {
  if (!v) return "—";
  const parts: string[] = [];
  if (v.unit_number) parts.push(`#${v.unit_number}`);
  if (v.year) parts.push(String(v.year));
  if (v.make) parts.push(v.make);
  if (v.model) parts.push(v.model);
  if (v.plate) parts.push(`(${v.plate})`);
  return parts.filter(Boolean).join(" ") || "—";
}

export default function ReportsCompletedPage() {
  const { locationId, locationLabel } = useLocationScope();

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const qs = new URLSearchParams();
        qs.set("status", "COMPLETED");
        qs.set("limit", "500");
        qs.set("sortBy", "completed_at");
        qs.set("sortDir", "desc");
        if (locationId) qs.set("location_id", locationId);

        const data = await fetchJSON<{ rows: Row[] }>(`/api/requests?${qs.toString()}`);
        if (!live) return;
        const list = data.rows || [];

        // Just in case sort again on client by completed_at desc
        list.sort((a, b) => {
          const da = a.completed_at ? new Date(a.completed_at).getTime() : 0;
          const db = b.completed_at ? new Date(b.completed_at).getTime() : 0;
          return db - da;
        });

        setRows(list);
      } catch (e: any) {
        if (!live) return;
        setErr(e?.message || "Failed to load completed requests");
        setRows([]);
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => {
      live = false;
    };
  }, [locationId]);

  const total = useMemo(() => rows.length, [rows]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Completed Requests</h1>
          <p className="text-sm text-gray-600">
            All completed jobs{locationLabel ? ` for ${locationLabel}` : ""}, with quick access to the full request details.
          </p>
        </div>
        <div className="text-right text-xs text-gray-600">
          {locationLabel && (
            <div>
              <span className="inline-flex items-center rounded-full border px-2 py-0.5 bg-gray-50">
                Location: <span className="ml-1 font-medium">{locationLabel}</span>
              </span>
            </div>
          )}
          <div className="mt-1">Total: {total}</div>
        </div>
      </header>

      {loading ? (
        <div className="text-sm text-gray-600">Loading completed requests…</div>
      ) : err ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {err}
        </div>
      ) : rows.length === 0 ? (
        <div className="text-sm text-gray-600">No completed requests found for this scope.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="min-w-full text-sm border-collapse">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-3 py-2 text-left">Completed</th>
                <th className="px-3 py-2 text-left">Customer</th>
                <th className="px-3 py-2 text-left">Location</th>
                <th className="px-3 py-2 text-left">Vehicle</th>
                <th className="px-3 py-2 text-left">Service</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2 whitespace-nowrap">
                    {fmtDateTime(r.completed_at)}
                  </td>
                  <td className="px-3 py-2">{r.customer?.name || "—"}</td>
                  <td className="px-3 py-2">{r.location?.name || "—"}</td>
                  <td className="px-3 py-2">{renderVehicle(r.vehicle)}</td>
                  <td className="px-3 py-2 max-w-xs truncate" title={r.service || undefined}>
                    {r.service || "—"}
                  </td>
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px]">
                      {r.status}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/fm/requests/${r.id}`}
                      className="text-xs text-blue-600 underline hover:text-blue-800"
                    >
                      View details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
