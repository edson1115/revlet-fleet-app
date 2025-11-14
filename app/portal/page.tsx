// app/portal/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Req = {
  id: string;
  status: string;
  service?: string | null;
  scheduled_at?: string | null;
  created_at?: string | null;
  vehicle?: {
    year?: number | null;
    make?: string | null;
    model?: string | null;
    plate?: string | null;
    unit_number?: string | null;
  } | null;
};

type Vehicle = {
  id: string;
  year?: number | null;
  make?: string | null;
  model?: string | null;
  plate?: string | null;
  unit_number?: string | null;
};

type ActivityItem = {
  id: string;
  text: string;
  created_at: string;
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
  return [v.year, v.make, v.model, v.plate || v.unit_number]
    .filter(Boolean)
    .join(" ") || "—";
}

export default function CustomerDashboardPage() {
  const [loading, setLoading] = useState(true);

  // metrics
  const [activeRequests, setActiveRequests] = useState<Req[]>([]);
  const [scheduled, setScheduled] = useState<Req[]>([]);
  const [completed, setCompleted] = useState<Req[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        setLoading(true);

        // Load requests (RLS auto-scopes to customer)
        const reqRes = await fetch(
          "/api/requests?limit=500&sortBy=created_at&sortDir=desc",
          { credentials: "include", cache: "no-store" }
        );
        const reqJs = await reqRes.json();
        const rows = reqJs.rows || [];

        if (!live) return;

        setActiveRequests(
          rows.filter((r: Req) =>
            ["NEW", "IN PROGRESS", "WAITING TO BE SCHEDULED"].includes(
              String(r.status).toUpperCase()
            )
          )
        );

        setScheduled(
          rows.filter(
            (r: Req) => String(r.status).toUpperCase() === "SCHEDULED"
          )
        );

        setCompleted(
          rows.filter(
            (r: Req) => String(r.status).toUpperCase() === "COMPLETED"
          )
        );

        // Load vehicles
        const vehRes = await fetch("/api/vehicles?limit=500", {
          credentials: "include",
          cache: "no-store",
        });
        const vehJs = await vehRes.json();
        if (live) setVehicles(vehJs.data || []);

        // Load activity feed
        const actRes = await fetch("/api/portal/activity", {
          credentials: "include",
          cache: "no-store",
        });
        const actJs = await actRes.json();
        if (live) setActivity(actJs.data || []);
      } finally {
        if (live) setLoading(false);
      }
    })();

    return () => {
      live = false;
    };
  }, []);

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-8">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      {/* ========== KPI ROW ========== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border rounded-2xl p-4 bg-white">
          <div className="text-sm text-gray-500">Active Requests</div>
          <div className="text-3xl font-semibold mt-1">
            {activeRequests.length}
          </div>
        </div>
        <div className="border rounded-2xl p-4 bg-white">
          <div className="text-sm text-gray-500">Scheduled</div>
          <div className="text-3xl font-semibold mt-1">
            {scheduled.length}
          </div>
        </div>
        <div className="border rounded-2xl p-4 bg-white">
          <div className="text-sm text-gray-500">Completed</div>
          <div className="text-3xl font-semibold mt-1">
            {completed.length}
          </div>
        </div>
        <div className="border rounded-2xl p-4 bg-white">
          <div className="text-sm text-gray-500">Vehicles</div>
          <div className="text-3xl font-semibold mt-1">
            {vehicles.length}
          </div>
        </div>
      </div>

      {/* ========== NEXT UPCOMING SERVICE ========== */}
      <div className="border rounded-2xl p-4 bg-white">
        <h2 className="text-lg font-semibold mb-3">Next Upcoming Service</h2>

        {scheduled.length === 0 ? (
          <div className="text-gray-500 text-sm">No scheduled services.</div>
        ) : (
          scheduled
            .slice(0, 1)
            .map((r) => (
              <Link
                key={r.id}
                href={`/portal/requests/${r.id}`}
                className="block border rounded-xl p-4 hover:shadow transition"
              >
                <div className="font-medium">{r.service}</div>
                <div className="text-sm text-gray-500 mt-1">
                  {vehLabel(r.vehicle)}
                </div>
                <div className="text-sm text-gray-600 mt-2">
                  Scheduled: {fmtDate(r.scheduled_at)}
                </div>
              </Link>
            ))
        )}
      </div>

      {/* ========== RECENT ACTIVITY FEED ========== */}
      <div className="border rounded-2xl p-4 bg-white">
        <h2 className="text-lg font-semibold mb-3">Recent Activity</h2>

        {activity.length === 0 ? (
          <div className="text-gray-500 text-sm">No recent activity.</div>
        ) : (
          <ul className="space-y-3">
            {activity.slice(0, 7).map((item) => (
              <li
                key={item.id}
                className="border rounded-xl p-3 bg-white hover:bg-gray-50"
              >
                <div className="text-sm">{item.text}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {fmtDate(item.created_at)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
