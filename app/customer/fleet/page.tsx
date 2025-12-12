"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  HealthRing,
  PredictionCard,
  RiskChip,
  Timeline,
} from "@/components/ai-fleet";

export default function FleetIntelligencePage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  async function load() {
    try {
      const res = await fetch("/api/health/fleet/summary", {
        cache: "no-store",
        credentials: "include",
      });

      const js = await res.json();
      if (!res.ok) throw new Error(js.error);

      setData(js);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) return <div className="p-6">Loading…</div>;
  if (err) return <div className="p-6 text-red-600">{err}</div>;

  const { fleet_health, predictions, risks, upcoming } = data;

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-10">
      <a href="/customer" className="text-sm text-blue-600 underline">
        ← Back to Portal
      </a>

      <h1 className="text-3xl font-semibold tracking-tight">
        Fleet Intelligence
      </h1>

      {/* TOP HEALTH BAND */}
      <div className="flex flex-col md:flex-row gap-8 md:gap-16 items-center">
        <HealthRing score={fleet_health} />

        <div className="space-y-2">
          <p className="text-gray-600">Fleet Health Score</p>
          <p className="text-4xl font-semibold">{fleet_health}/100</p>

          <p className="text-sm text-gray-500 max-w-sm">
            Score based on mileage, wear indicators, fault history, anomalies
            detected, and AI failure risk.
          </p>
        </div>
      </div>

      {/* RISKS */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Fleet Risks</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {risks.map((r: any, i: number) => (
            <RiskChip key={i} risk={r} />
          ))}
        </div>
      </div>

      {/* AI PREDICTIONS */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Predicted Failures</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {predictions.map((p: any, i: number) => (
            <PredictionCard key={i} item={p} />
          ))}
        </div>
      </div>

      {/* FUTURE TIMELINE */}
      <div>
        <h2 className="text-xl font-semibold mb-3">30-Day Timeline</h2>

        <Timeline items={upcoming} />
      </div>
    </div>
  );
}
