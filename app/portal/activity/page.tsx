// app/portal/activity/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ActivityItem = {
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
  customer?: {
    name?: string | null;
  } | null;
  created_at?: string | null;
  scheduled_at?: string | null;
  completed_at?: string | null;
  dispatch_notes?: string | null;
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
  return [
    v.year,
    v.make,
    v.model,
    v.plate || v.unit_number,
  ]
    .filter(Boolean)
    .join(" ") || "—";
}

function statusColor(status: string) {
  const s = status.toUpperCase();
  if (s === "COMPLETED") return "bg-emerald-100 text-emerald-800 border-emerald-300";
  if (s === "SCHEDULED") return "bg-sky-100 text-sky-800 border-sky-300";
  if (s === "IN PROGRESS") return "bg-blue-100 text-blue-800 border-blue-300";
  if (s.startsWith("WAITING")) return "bg-amber-100 text-amber-800 border-amber-300";
  return "bg-gray-100 text-gray-700 border-gray-300";
}

export default function CustomerActivityPage() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;

    (async () => {
      setLoading(true);
      try {
        const url =
          "/api/requests?limit=5000&sortBy=created_at&sortDir=desc";
        const res = await fetch(url, {
          credentials: "include",
          cache: "no-store",
        });
        const js = await res.json();
        if (live) setItems(js.rows || []);
      } catch {
        if (live) setItems([]);
      } finally {
        if (live) setLoading(false);
      }
    })();

    return () => {
      live = false;
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-semibold">Activity Feed</h1>

      {loading ? (
        <div className="text-gray-500">Loading activity…</div>
      ) : items.length === 0 ? (
        <div className="text-gray-500">No activity yet.</div>
      ) : (
        <div className="space-y-4">

          {items.map((r) => (
            <div
              key={r.id}
              className="border rounded-2xl bg-white p-4 shadow-sm hover:shadow transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="font-medium">{r.service || "Service"}</div>
                <div className="text-xs text-gray-500">
                  {fmtDate(r.created_at)}
                </div>
              </div>

              <div className="text-sm text-gray-600 mt-1">
                {vehLabel(r.vehicle)}
              </div>

              <div
                className={`inline-block mt-2 text-xs px-2 py-1 rounded-full border ${statusColor(
                  r.status
                )}`}
              >
                {r.status}
              </div>

              {/* Optional dispatcher notes */}
              {r.dispatch_notes && (
                <div className="mt-3 text-xs text-gray-700">
                  <span className="font-medium">Update: </span>
                  {r.dispatch_notes}
                </div>
              )}

              {/* Links */}
              <div className="mt-3">
                <Link
                  href={`/portal/requests/${r.id}`}
                  className="text-blue-600 underline text-xs"
                >
                  View details →
                </Link>
              </div>
            </div>
          ))}

        </div>
      )}
    </div>
  );
}
