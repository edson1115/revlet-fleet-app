"use client";

import { useEffect, useState } from "react";
import TeslaLayoutShell from "@/components/tesla/layout/TeslaLayoutShell";
import { TeslaHeroBar } from "@/components/tesla/TeslaHeroBar";
import { TeslaSection } from "@/components/tesla/TeslaSection";
import { TeslaStatCard } from "@/components/tesla/TeslaStatCard";
import { TeslaChartCard } from "@/components/tesla/TeslaChartCard";

export default function TechAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/tech/analytics", { cache: "no-store" });
    const js = await res.json();
    if (js.ok) setStats(js.stats);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  if (loading || !stats) {
    return (
      <TeslaLayoutShell>
        <div className="p-10 text-center text-gray-500">Loading…</div>
      </TeslaLayoutShell>
    );
  }

  return (
    <TeslaLayoutShell>
      <TeslaHeroBar
        title="Tech Performance"
        subtitle="Your productivity & job insights"
      />

      <div className="max-w-6xl mx-auto p-6 space-y-12">
        
        {/* STAT CARDS */}
        <TeslaSection label="Overview">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

            <TeslaStatCard
              label="Completed Today"
              value={stats.todayCompleted}
            />

            <TeslaStatCard
              label="Completed This Week"
              value={stats.weekCompleted}
            />

            <TeslaStatCard
              label="Avg Completion Time"
              value={stats.avgCompletionTime ? `${stats.avgCompletionTime} min` : "—"}
            />

            <TeslaStatCard
              label="Photos Uploaded"
              value={stats.totalPhotos}
            />

            <TeslaStatCard
              label="Damage Detection Rate"
              value={`${stats.damageRate}%`}
            />

            <TeslaStatCard
              label="Parts Used"
              value={stats.partsUsed}
            />

          </div>
        </TeslaSection>

        {/* BAR CHART — JOBS PER DAY */}
        <TeslaSection label="Jobs Completed (Last 7 Days)">
          <TeslaChartCard
            labels={stats.chart.labels}
            values={stats.chart.values}
          />
        </TeslaSection>

      </div>

    </TeslaLayoutShell>
  );
}
