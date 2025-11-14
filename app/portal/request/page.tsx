// app/portal/requests/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type RequestRow = {
  id: string;
  status: string;
  service?: string | null;
  vehicle?: {
    id: string;
    year?: number | null;
    make?: string | null;
    model?: string | null;
    plate?: string | null;
    unit_number?: string | null;
  } | null;
  created_at?: string | null;
  scheduled_at?: string | null;
};

function fmtDate(d?: string | null) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString();
  } catch {
    return d;
  }
}

function vehLabel(v: any) {
  if (!v) return "—";
  const arr = [v.year, v.make, v.model, v.plate || v.unit_number];
  return arr.filter(Boolean).join(" ") || "—";
}

export default function CustomerRequestsPage() {
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  useEffect(() => {
    let live = true;
    (async () => {
      setLoading(true);
      try {
        const url = "/api/requests?limit=500&sortBy=created_at&sortDir=desc";
        const res = await fetch(url, {
          credentials: "include",
          cache: "no-store",
        });
        const js = await res.json();
        if (live) setRows(js.rows || []);
      } catch {
        if (live) setRows([]);
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  const filtered = rows.filter((r) => {
    if (statusFilter === "ALL") return true;
    return String(r.status).toUpperCase() === statusFilter;
  });

  return (
    <div className="p-6 mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Service Requests</h1>
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        {["ALL", "NEW", "SCHEDULED", "IN PROGRESS", "COMPLETED"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded border ${
              statusFilter === s
                ? "bg-black text-white"
                : "bg-white hover:bg-gray-50"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-gray-500">Loading requests…</div>
      ) : filtered.length === 0 ? (
        <div className="text-gray-500">No requests found.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <Link
              key={r.id}
              href={`/portal/requests/${r.id}`}
              className="block rounded-2xl border bg-white p-4 hover:shadow transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="font-medium">{r.service || "Service"}</div>
                <div className="text-sm text-gray-500">
                  {fmtDate(r.created_at)}
                </div>
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {vehLabel(r.vehicle)}
              </div>
              <div className="mt-2 inline-block text-xs px-2 py-1 border rounded-full">
                {r.status}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
