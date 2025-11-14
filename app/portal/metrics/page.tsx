// app/portal/metrics/page.tsx
"use client";

import { useEffect, useState } from "react";

type Metrics = {
  avg_response_minutes: number | null;
  avg_dispatch_minutes: number | null;
  avg_completion_minutes: number | null;
  sla_compliance: number | null;
  daily_counts: Array<{ day: string; count: number }>;
  service_breakdown: Array<{ service: string; avg_minutes: number; count: number }>;
  vehicle_breakdown: Array<{ vehicle: string; avg_minutes: number; count: number }>;
};

function fmtMin(m: number | null) {
  if (!m && m !== 0) return "—";
  if (m < 60) return `${m} min`;
  return `${(m / 60).toFixed(1)} hrs`;
}

export default function CustomerMetricsPage() {
  const [data, setData] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;

    (async () => {
      try {
        const res = await fetch("/api/portal/metrics", {
          credentials: "include",
          cache: "no-store",
        });
        const js = await res.json();

        if (live) setData(js);
      } catch {
        if (live) setData(null);
      } finally {
        if (live) setLoading(false);
      }
    })();

    return () => { live = false; };
  }, []);

  return (
    <div className="p-6 mx-auto max-w-5xl space-y-10">
      <h1 className="text-2xl font-semibold">Service Metrics</h1>

      {loading ? (
        <div>Loading…</div>
      ) : !data ? (
        <div className="text-gray-600">No metrics available.</div>
      ) : (
        <>
          {/* KPI CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="border rounded-2xl p-4 bg-white">
              <div className="text-sm text-gray-500">Avg Response</div>
              <div className="text-2xl font-semibold">{fmtMin(data.avg_response_minutes)}</div>
            </div>

            <div className="border rounded-2xl p-4 bg-white">
              <div className="text-sm text-gray-500">Avg Dispatch Time</div>
              <div className="text-2xl font-semibold">{fmtMin(data.avg_dispatch_minutes)}</div>
            </div>

            <div className="border rounded-2xl p-4 bg-white">
              <div className="text-sm text-gray-500">Avg Completion Time</div>
              <div className="text-2xl font-semibold">{fmtMin(data.avg_completion_minutes)}</div>
            </div>

            <div className="border rounded-2xl p-4 bg-white">
              <div className="text-sm text-gray-500">SLA Compliance</div>
              <div className="text-2xl font-semibold">
                {data.sla_compliance !== null ? `${data.sla_compliance}%` : "—"}
              </div>
            </div>
          </div>

          {/* SERVICE BREAKDOWN */}
          <section>
            <h2 className="text-xl font-semibold mb-3">Service Type Breakdown</h2>
            <div className="border rounded-2xl bg-white p-4">
              {data.service_breakdown.length === 0 ? (
                <div className="text-sm text-gray-500">No service history.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="p-2 text-left">Service</th>
                      <th className="p-2 text-left">Avg Completion</th>
                      <th className="p-2 text-left">Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.service_breakdown.map((r) => (
                      <tr key={r.service} className="border-b">
                        <td className="p-2">{r.service}</td>
                        <td className="p-2">{fmtMin(r.avg_minutes)}</td>
                        <td className="p-2">{r.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
