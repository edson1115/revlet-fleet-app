"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function FleetAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [vehicles, setVehicles] = useState<any[]>([]);
  const [groupCounts, setGroupCounts] = useState<any>({});
  const [yearCounts, setYearCounts] = useState<any>({});
  const [modelCounts, setModelCounts] = useState<any>({});
  const [insights, setInsights] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/customer/vehicles/analytics", {
          cache: "no-store",
          credentials: "include",
        });

        const js = await res.json();

        if (!res.ok) throw new Error(js.error);

        setVehicles(js.vehicles || []);
        setGroupCounts(js.groupCounts || {});
        setYearCounts(js.yearCounts || {});
        setModelCounts(js.modelCounts || {});
        setInsights(js.insights || "");
      } catch (e: any) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="p-8">Loading analytics…</div>;
  if (err) return <div className="p-8 text-red-600">{err}</div>;

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-10">
      <a href="/customer/vehicles" className="text-sm text-blue-600 underline">
        ← Back to Vehicles
      </a>

      <h1 className="text-3xl font-semibold tracking-tight">
        Fleet Analytics
      </h1>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Vehicles" value={vehicles.length} />
        <StatCard label="Groups" value={Object.keys(groupCounts).length} />
        <StatCard label="Models" value={Object.keys(modelCounts).length} />
        <StatCard label="Years" value={Object.keys(yearCounts).length} />
      </div>

      {/* GROUP DISTRIBUTION */}
      <AnalyticsSection title="Vehicles per Group">
        <SimpleList data={groupCounts} />
      </AnalyticsSection>

      {/* MODEL DISTRIBUTION */}
      <AnalyticsSection title="Fleet by Model">
        <SimpleList data={modelCounts} />
      </AnalyticsSection>

      {/* YEAR DISTRIBUTION */}
      <AnalyticsSection title="Year Breakdown">
        <SimpleList data={yearCounts} />
      </AnalyticsSection>

      {/* AI INSIGHTS */}
      <div className="rounded-2xl border shadow-sm bg-white p-6">
        <h2 className="text-xl font-semibold mb-3">AI Fleet Insights</h2>
        <pre className="whitespace-pre-wrap text-gray-800 text-sm">
          {insights}
        </pre>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-white shadow-sm border p-4">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}

function AnalyticsSection({ title, children }: any) {
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div>{children}</div>
    </div>
  );
}

function SimpleList({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data);

  if (entries.length === 0)
    return <div className="text-sm text-gray-500">No data</div>;

  return (
    <ul className="space-y-2">
      {entries.map(([key, val]) => (
        <li
          key={key}
          className="flex justify-between border-b py-2 text-sm"
        >
          <span>{key}</span>
          <span className="font-semibold">{val}</span>
        </li>
      ))}
    </ul>
  );
}
