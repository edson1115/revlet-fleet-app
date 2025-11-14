// app/portal/performance/page.tsx
"use client";

import { useEffect, useState } from "react";

type Metrics = {
  uptime_percent: number | null;
  failure_rate: number | null;
  category_breakdown: Array<{ category: string; count: number }>;
  problem_vehicles: Array<{ id: string; label: string; score: number }>;
  vehicle_health: Array<{ id: string; label: string; score: number }>;
  mileage_trends: Array<{ vehicle: string; month: string; miles: number }>;
  cost_trend: Array<{ month: string; total: number }>;
};

export default function PerformancePage() {
  const [data, setData] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔥 AI INSIGHTS
  const [ai, setAi] = useState<any[] | null>(null);

  // Load core metrics
  useEffect(() => {
    let live = true;

    (async () => {
      try {
        const res = await fetch("/api/portal/performance", {
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

    return () => {
      live = false;
    };
  }, []);

  // Load AI insights
  useEffect(() => {
    let live = true;

    (async () => {
      try {
        const res = await fetch("/api/portal/insights", {
          credentials: "include",
          cache: "no-store",
        });
        const js = await res.json();
        if (live) setAi(js.insights || []);
      } catch {
        if (live) setAi([]);
      }
    })();

    return () => {
      live = false;
    };
  }, []);

  function pct(v: number | null) {
    if (v === null) return "—";
    return `${v}%`;
  }

  return (
    <div className="p-6 mx-auto max-w-6xl space-y-10">
      <h1 className="text-2xl font-semibold">Fleet Performance</h1>

      {loading ? (
        <div className="text-gray-500">Loading performance metrics…</div>
      ) : !data ? (
        <div className="text-gray-600">No data available.</div>
      ) : (
        <>
          {/* KPI CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="border rounded-2xl p-4 bg-white">
              <div className="text-sm text-gray-500">Fleet Uptime</div>
              <div className="text-3xl font-semibold">{pct(data.uptime_percent)}</div>
            </div>

            <div className="border rounded-2xl p-4 bg-white">
              <div className="text-sm text-gray-500">Failure Rate</div>
              <div className="text-3xl font-semibold">{data.failure_rate ?? "—"}</div>
              <div className="text-xs text-gray-500">issues per 1,000 miles</div>
            </div>

            <div className="border rounded-2xl p-4 bg-white">
              <div className="text-sm text-gray-500">Problem Vehicles</div>
              <div className="text-3xl font-semibold">
                {data.problem_vehicles.length || 0}
              </div>
            </div>

            <div className="border rounded-2xl p-4 bg-white">
              <div className="text-sm text-gray-500">Avg Vehicle Health</div>
              <div className="text-3xl font-semibold">
                {data.vehicle_health.length
                  ? `${Math.round(
                      data.vehicle_health.reduce((a, b) => a + b.score, 0) /
                        data.vehicle_health.length
                    )}/100`
                  : "—"}
              </div>
            </div>
          </div>

          {/* CATEGORY BREAKDOWN */}
          <section>
            <h2 className="text-xl font-semibold mb-3">Repairs by Category</h2>
            <div className="border rounded-2xl bg-white p-4">
              {data.category_breakdown.length === 0 ? (
                <div className="text-sm text-gray-500">No service history.</div>
              ) : (
                <ul className="space-y-2">
                  {data.category_breakdown.map((c) => (
                    <li key={c.category} className="flex justify-between text-sm">
                      <span>{c.category}</span>
                      <span className="font-semibold">{c.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* PROBLEM VEHICLES */}
          <section>
            <h2 className="text-xl font-semibold mb-3">Problem Vehicles</h2>
            <div className="border rounded-2xl bg-white p-4">
              {data.problem_vehicles.length === 0 ? (
                <div className="text-sm text-gray-500">No issues detected.</div>
              ) : (
                <ul className="space-y-2">
                  {data.problem_vehicles.map((v) => (
                    <li key={v.id} className="flex justify-between text-sm">
                      <span>{v.label}</span>
                      <span className="font-semibold">{v.score}/100</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* Mileage Trends */}
          <section>
            <h2 className="text-xl font-semibold mb-3">Mileage Trends</h2>
            <div className="border rounded-2xl bg-white p-4 text-sm text-gray-600">
              Coming soon — integrating vehicle odometer ingestion.
            </div>
          </section>

          {/* Cost Trend */}
          <section>
            <h2 className="text-xl font-semibold mb-3">Cost Trend</h2>
            <div className="border rounded-2xl bg-white p-4 text-sm text-gray-600">
              Coming soon — using PO & invoice data.
            </div>
          </section>

          {/* 🔥 AI INSIGHTS */}
          <section>
            <h2 className="text-xl font-semibold mb-3">AI Insights</h2>

            {!ai ? (
              <div className="text-gray-500">Loading insights…</div>
            ) : ai.length === 0 ? (
              <div className="text-gray-600">No insights available yet.</div>
            ) : (
              <div className="space-y-3">
                {ai.map((ins: any, idx: number) => (
                  <div
                    key={idx}
                    className="border rounded-2xl bg-white p-4 hover:shadow transition-all"
                  >
                    <div className="font-semibold text-sm">{ins.title}</div>
                    <div className="text-gray-700 text-sm mt-1 whitespace-pre-wrap">
                      {ins.body}
                    </div>
                    {ins.tags?.length ? (
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {ins.tags.map((t: string, i: number) => (
                          <span
                            key={i}
                            className="text-[10px] px-2 py-0.5 bg-gray-100 border rounded-full text-gray-600"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
