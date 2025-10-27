// app/office/queue/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type UUID = string;
type Status =
  | "NEW"
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "WAITING_APPROVAL"
  | "WAITING_PARTS"
  | "DECLINED";

type Row = {
  id: UUID;
  status: Status;
  service: string | null;
  po: string | null;
  created_at: string;
  customer?: { id: UUID; name: string | null } | null;
  vehicle?: { id: UUID; year: number | null; make: string | null; model: string | null; unit_number?: string | null } | null;
  technician?: { id: UUID; full_name: string | null } | null;
};

const STATUS_TABS: (Status | "ALL")[] = [
  "ALL",
  "NEW",
  "WAITING_APPROVAL",
  "WAITING_PARTS",
  "DECLINED",
  "SCHEDULED",
  "IN_PROGRESS",
  "COMPLETED",
];

function vehicleShort(v?: Row["vehicle"]) {
  if (!v) return "—";
  const base = [v.year, v.make, v.model].filter(Boolean).join(" ");
  return [base, v.unit_number ? `#${v.unit_number}` : null].filter(Boolean).join(" ");
}

export default function OfficeQueuePage() {
  const [tab, setTab] = useState<Status | "ALL">("ALL");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = async (status?: Status | "ALL") => {
    setLoading(true);
    setErr(null);
    try {
      const qs = status && status !== "ALL" ? `?status=${encodeURIComponent(status)}` : "";
      const res = await fetch(`/api/requests${qs}`, { credentials: "include" });
      const js = await res.json();
      if (!res.ok) throw new Error(js?.error || "Failed to load queue");
      setRows((js.rows || []) as Row[]);
    } catch (e: any) {
      setErr(e?.message || "Failed to load queue");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const emptyMsg = useMemo(() => {
    if (tab === "ALL") return "No requests yet.";
    return `No requests in ${tab}.`;
  }, [tab]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Office Queue</h1>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((s) => {
          const active = tab === s;
          return (
            <button
              key={s}
              onClick={() => setTab(s)}
              className={`rounded-full border px-3 py-1 text-sm ${active ? "bg-black text-white" : "bg-white"}`}
            >
              {s}
            </button>
          );
        })}
      </div>

      {err && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {err}
        </div>
      )}

      <div className="overflow-x-auto border rounded">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3 w-[140px]">Created</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Customer</th>
              <th className="text-left p-3">Vehicle</th>
              <th className="text-left p-3">Service</th>
              <th className="text-left p-3">PO</th>
              <th className="text-left p-3">Tech</th> {/* NEW */}
              <th className="text-left p-3 w-[90px]">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={8} className="p-6 text-center text-gray-500">Loading…</td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={8} className="p-6 text-center text-gray-500">{emptyMsg}</td>
              </tr>
            )}
            {!loading && rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3">{r.created_at ? new Date(r.created_at).toLocaleString() : "—"}</td>
                <td className="p-3">{r.status}</td>
                <td className="p-3">{r.customer?.name ?? "—"}</td>
                <td className="p-3">{vehicleShort(r.vehicle)}</td>
                <td className="p-3">{r.service ?? "—"}</td>
                <td className="p-3">{r.po ?? "—"}</td>
                <td className="p-3">{r.technician?.full_name ?? "—"}</td> {/* NEW */}
                <td className="p-3">
                  <Link
                    href={`/office/requests/${r.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    Open
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
