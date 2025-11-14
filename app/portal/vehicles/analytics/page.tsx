// app/portal/vehicles/analytics/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";

type Vehicle = {
  id: string;
  unit_number?: string | null;
  year?: number | null;
  make?: string | null;
  model?: string | null;
  plate?: string | null;
};

type RequestRow = {
  id: string;
  status: string;
  vehicle?: Vehicle | null;
  created_at?: string | null;
  scheduled_at?: string | null;
  completed_at?: string | null;
};

function vehKey(v: Vehicle) {
  return [
    v.year,
    v.make,
    v.model,
    v.plate || v.unit_number,
  ]
    .filter(Boolean)
    .join(" ");
}

function fmt(n: number) {
  return n.toLocaleString();
}

export default function CustomerVehicleAnalyticsPage() {
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Load service_requests
  useEffect(() => {
    let live = true;

    (async () => {
      try {
        const res = await fetch(
          "/api/requests?limit=5000&sortBy=created_at&sortDir=desc",
          {
            credentials: "include",
            cache: "no-store",
          }
        );
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

  // --- GROUP REQUESTS PER VEHICLE ---
  const perVehicle = useMemo(() => {
    const map = new Map<string, { vehicle: Vehicle; reqs: RequestRow[] }>();

    rows.forEach((r) => {
      if (!r.vehicle?.id) return;
      const key = r.vehicle.id;
      if (!map.has(key)) map.set(key, { vehicle: r.vehicle, reqs: [] });
      map.get(key)!.reqs.push(r);
    });

    return Array.from(map.values());
  }, [rows]);

  // --- METRICS ---
  const totalVehicles = perVehicle.length;

  const needingService = perVehicle.filter((v) =>
    v.reqs.some((r) =>
      ["NEW", "WAITING_TO_BE_SCHEDULED", "RESCHEDULE"].includes(
        r.status.toUpperCase()
      )
    )
  ).length;

  const inProgress = perVehicle.filter((v) =>
    v.reqs.some((r) => r.status.toUpperCase() === "IN PROGRESS")
  ).length;

  const recentlyCompleted = perVehicle.filter((v) =>
    v.reqs.some((r) => r.status.toUpperCase() === "COMPLETED")
  ).length;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-10">
      <h1 className="text-2xl font-semibold">Vehicle Analytics</h1>

      {/* ---- KPI CARDS ---- */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border p-4 bg-white">
          <div className="text-xs text-gray-500">Total Vehicles</div>
          <div className="text-3xl font-semibold">{fmt(totalVehicles)}</div>
        </div>

        <div className="rounded-2xl border p-4 bg-white">
          <div className="text-xs text-gray-500">Needing Service</div>
          <div className="text-3xl font-semibold text-amber-600">
            {fmt(needingService)}
          </div>
        </div>

        <div className="rounded-2xl border p-4 bg-white">
          <div className="text-xs text-gray-500">In Progress</div>
          <div className="text-3xl font-semibold text-blue-600">
            {fmt(inProgress)}
          </div>
        </div>

        <div className="rounded-2xl border p-4 bg-white">
          <div className="text-xs text-gray-500">Recently Completed</div>
          <div className="text-3xl font-semibold text-emerald-600">
            {fmt(recentlyCompleted)}
          </div>
        </div>
      </div>

      {/* ---- PER VEHICLE ACTIVITY TABLE ---- */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Vehicles Overview</h2>

        {loading ? (
          <div className="text-gray-500">Loading analytics…</div>
        ) : perVehicle.length === 0 ? (
          <div className="text-gray-500">No vehicles found.</div>
        ) : (
          <div className="rounded-2xl border bg-white divide-y">
            {perVehicle.map(({ vehicle, reqs }) => {
              const last = reqs[0]; // sorted by created_at desc

              return (
                <Link
                  key={vehicle.id}
                  href={`/portal/vehicles/${vehicle.id}`}
                  className="block px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{vehKey(vehicle)}</div>
                    <div className="text-xs rounded-full border px-2 py-1">
                      {last.status}
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 mt-1">
                    {reqs.length} service visit
                    {reqs.length !== 1 ? "s" : ""} • Last:{" "}
                    {last.created_at
                      ? new Date(last.created_at).toLocaleDateString()
                      : "—"}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
