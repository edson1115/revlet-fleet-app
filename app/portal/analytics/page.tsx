// app/portal/analytics/page.tsx
"use client";

import { useEffect, useState } from "react";

type Req = {
  id: string;
  status: string;
  created_at: string | null;
  completed_at: string | null;
  service?: string | null;
};

type Vehicle = {
  id: string;
};

function fmtMonth(d: string | null) {
  if (!d) return "—";
  const dt = new Date(d);
  return dt.toLocaleString(undefined, { month: "short", year: "numeric" });
}

export default function CustomerAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [reqs, setReqs] = useState<Req[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  useEffect(() => {
    let live = true;

    (async () => {
      try {
        setLoading(true);

        // Load all service requests (RLS scopes to customer)
        const r = await fetch(
          "/api/requests?limit=5000&sortBy=created_at&sortDir=asc",
          { credentials: "include", cache: "no-store" }
        );
        const rj = await r.json();
        if (!live) return;
        setReqs(rj.rows || []);

        // Load vehicles
        const v = await fetch("/api/vehicles?limit=2000", {
          credentials: "include",
          cache: "no-store",
        });
        const vj = await v.json();
        if (live) setVehicles(vj.data || []);
      } finally {
        if (live) setLoading(false);
      }
    })();

    return () => {
      live = false;
    };
  }, []);

  // Derived metrics
  const completed = reqs.filter((r) => r.status === "COMPLETED");
  const scheduled = reqs.filter((r) => r.status === "SCHEDULED");
  const active = reqs.filter((r) =>
    ["NEW", "IN PROGRESS", "WAITING TO BE SCHEDULED"].includes(
      r.status.toUpperCase()
    )
  );

  // Trend: Count by month
  const byMonth: Record<string, number> = {};
  reqs.forEach((r) => {
    if (!r.created_at) return;
    const key = fmtMonth(r.created_at);
    byMonth[key] = (byMonth[key] || 0) + 1;
  });

  const monthlyKeys = Object.keys(byMonth);

  // Service mix
  const serviceMix: Record<string, number> = {};
  reqs.forEach((r) => {
    const s = r.service || "Unknown";
    serviceMix[s] = (serviceMix[s] || 0) + 1;
  });

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-semibold">Analytics</h1>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="border rounded-2xl p-4 bg-white">
          <div className="text-sm text-gray-500">Total Requests</div>
          <div className="text-3xl font-semibold">{reqs.length}</div>
        </div>
        <div className="border rounded-2xl p-4 bg-white">
          <div className="text-sm text-gray-500">Completed</div>
          <div className="text-3xl font-semibold">{completed.length}</div>
        </div>
        <div className="border rounded-2xl p-4 bg-white">
          <div className="text-sm text-gray-500">Active</div>
          <div className="text-3xl font-semibold">{active.length}</div>
        </div>
      </div>

      {/* Service Mix */}
      <div className="border rounded-2xl p-4 bg-white">
        <h2 className="text-lg font-semibold mb-3">Service Breakdown</h2>
        <div className="space-y-2 text-sm">
          {Object.keys(serviceMix).map((s) => (
            <div key={s} className="flex items-center justify-between">
              <span>{s}</span>
              <span className="font-medium">{serviceMix[s]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Trend */}
      <div className="border rounded-2xl p-4 bg-white">
        <h2 className="text-lg font-semibold mb-3">Requests Over Time</h2>

        {monthlyKeys.length === 0 ? (
          <div className="text-gray-500 text-sm">No data yet.</div>
        ) : (
          <div className="space-y-1 text-sm">
            {monthlyKeys.map((m) => (
              <div key={m} className="flex items-center justify-between">
                <span>{m}</span>
                <span className="font-medium">{byMonth[m]}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Vehicle Count */}
      <div className="border rounded-2xl p-4 bg-white">
        <h2 className="text-lg font-semibold">Fleet Size</h2>
        <div className="text-3xl font-semibold mt-1">{vehicles.length}</div>
      </div>
    </div>
  );
}
