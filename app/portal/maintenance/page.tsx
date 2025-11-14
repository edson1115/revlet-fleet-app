// app/portal/maintenance/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type PMRow = {
  vehicle_id: string;
  unit_number?: string | null;
  year?: number | null;
  make?: string | null;
  model?: string | null;
  plate?: string | null;
  mileage?: number | null;

  // PM tracking
  last_pm_mileage?: number | null;
  last_pm_date?: string | null;

  next_pm_mileage?: number | null;
  next_pm_date?: string | null;

  status: "OVERDUE" | "DUE_SOON" | "GOOD" | "MISSING";
};

export default function PortalMaintenancePage() {
  const [rows, setRows] = useState<PMRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const res = await fetch("/api/portal/maintenance", {
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

  const groups = {
    OVERDUE: rows.filter((r) => r.status === "OVERDUE"),
    DUE_SOON: rows.filter((r) => r.status === "DUE_SOON"),
    GOOD: rows.filter((r) => r.status === "GOOD"),
    MISSING: rows.filter((r) => r.status === "MISSING"),
  };

  function veh(v: PMRow) {
    return [
      v.year,
      v.make,
      v.model,
      v.plate || v.unit_number,
    ]
      .filter(Boolean)
      .join(" ");
  }

  return (
    <div className="p-6 mx-auto max-w-5xl space-y-8">
      <h1 className="text-2xl font-semibold">Maintenance Planner</h1>

      {loading ? (
        <div>Loading…</div>
      ) : (
        <>
          {[
            ["OVERDUE", "text-red-600 border-red-200 bg-red-50"],
            ["DUE_SOON", "text-amber-600 border-amber-200 bg-amber-50"],
            ["GOOD", "text-green-700 border-green-200 bg-green-50"],
            ["MISSING", "text-gray-700 border-gray-200 bg-gray-50"],
          ].map(([key, className]) => {
            const arr = groups[key as keyof typeof groups];
            if (arr.length === 0) return null;

            return (
              <div key={key}>
                <h2 className="text-xl font-semibold mb-2">{key.replace("_", " ")}</h2>
                <div className="space-y-3">
                  {arr.map((r) => (
                    <div
                      key={r.vehicle_id}
                      className={`border rounded-2xl p-4 ${className}`}
                    >
                      <div className="flex justify-between">
                        <div className="font-medium">{veh(r)}</div>
                        <Link
                          href={`/portal/vehicles/${r.vehicle_id}`}
                          className="text-sm underline"
                        >
                          View
                        </Link>
                      </div>

                      <div className="text-sm mt-2">
                        <div>Mileage: {r.mileage ?? "—"}</div>
                        <div>Last PM: {r.last_pm_mileage ?? "—"}</div>
                        <div>Next PM: {r.next_pm_mileage ?? "—"}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
