"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Vehicle =
  | {
      id: string;
      unit_number?: string | null;
      year?: number | null;
      make?: string | null;
      model?: string | null;
      plate?: string | null;
    }
  | null;

type Row = {
  id: string;
  status: string;
  created_at?: string | null;
  scheduled_at?: string | null;
  service?: string | null;
  priority?: string | null;
  customer?: { id: string; name?: string | null } | null;
  location?: { id: string; name?: string | null } | null;
  vehicle?: Vehicle;
  po?: string | null;
  fmc?: string | null;
};

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `HTTP ${res.status} ${res.statusText}${text ? ` – ${text}` : ""}`
    );
  }
  return (await res.json()) as T;
}

function normStatus(s?: string | null): string {
  return String(s || "")
    .toUpperCase()
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function fmtDateTime(dt?: string | null) {
  if (!dt) return "—";
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return dt ?? "—";
  return d.toLocaleString(undefined, {
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
  return parts.join(" ") || "—";
}

export default function CustomerRequestsPage() {
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
        qs.set("limit", "500");
        qs.set("sortBy", "created_at");
        qs.set("sortDir", "desc");
        const data = await fetchJSON<{ rows: Row[] }>(
          `/api/requests?${qs.toString()}`
        );
        if (!live) return;
        setRows(data.rows || []);
      } catch (e: any) {
        if (!live) return;
        setErr(e?.message || "Failed to load requests");
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">My Requests</h1>
          <p className="text-sm text-gray-600">
            All service requests for your fleet, scoped to your account.
          </p>
        </div>
        <Link
          href="/fm/requests/new"
          className="rounded-lg border border-black bg-black text-white text-sm px-4 py-2 hover:bg-gray-900"
        >
          + Create Request
        </Link>
      </header>

      {loading ? (
        <div className="text-sm text-gray-500">Loading…</div>
      ) : err ? (
        <div className="text-sm text-red-600">Error: {err}</div>
      ) : rows.length === 0 ? (
        <div className="text-sm text-gray-500">
          No requests yet.{" "}
          <Link href="/fm/requests/new" className="underline">
            Create your first one.
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left px-3 py-2">Created</th>
                <th className="text-left px-3 py-2">Status</th>
                <th className="text-left px-3 py-2">Service</th>
                <th className="text-left px-3 py-2">Vehicle</th>
                <th className="text-left px-3 py-2">Location</th>
                <th className="text-left px-3 py-2">Priority</th>
                <th className="text-left px-3 py-2">PO</th>
                <th className="text-left px-3 py-2">FMC</th>
                <th className="text-left px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-b hover:bg-gray-50"
                >
                  <td className="px-3 py-2">
                    {fmtDateTime(r.created_at)}
                  </td>
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center rounded-full border px-2 py-0.5">
                      {normStatus(r.status)}
                    </span>
                  </td>
                  <td className="px-3 py-2">{r.service || "—"}</td>
                  <td className="px-3 py-2">
                    {renderVehicle(r.vehicle)}
                  </td>
                  <td className="px-3 py-2">
                    {r.location?.name || "—"}
                  </td>
                  <td className="px-3 py-2">
                    {r.priority || "—"}
                  </td>
                  <td className="px-3 py-2">
                    {r.po || "—"}
                  </td>
                  <td className="px-3 py-2">
                    {r.fmc || "—"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Link
                      href={`/fm/requests/${encodeURIComponent(r.id)}`}
                      className="text-xs text-gray-700 underline"
                    >
                      Details
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
