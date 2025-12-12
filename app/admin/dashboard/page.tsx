"use client";

import { useEffect, useState } from "react";
import TeslaLayoutShell from "@/components/tesla/layout/TeslaLayoutShell";
import { TeslaHeroBar } from "@/components/tesla/TeslaHeroBar";
import { TeslaSection } from "@/components/tesla/TeslaSection";
import { TeslaStatCard } from "@/components/tesla/TeslaStatCard";
import { TeslaChartCard } from "@/components/tesla/TeslaChartCard";
import { TeslaListRow } from "@/components/tesla/TeslaListRow";
import { TeslaTechAvailability } from "@/components/tesla/TeslaTechAvailability";

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [markets, setMarkets] = useState<any[]>([]);

  async function load() {
    setLoading(true);

    const a = await fetch("/api/admin/analytics", { cache: "no-store" }).then((r) =>
      r.json()
    );

    const m = await fetch("/api/admin/markets", { cache: "no-store" }).then((r) =>
      r.json()
    );

    if (a.ok) setStats(a.stats);
    if (m.ok) setMarkets(m.markets);

    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  if (loading || !stats) {
    return (
      <TeslaLayoutShell>
        <div className="p-10 text-center text-gray-500">Loading dashboard…</div>
      </TeslaLayoutShell>
    );
  }

  return (
    <TeslaLayoutShell>
      <TeslaHeroBar
        title="Admin Dashboard"
        subtitle="Nationwide performance & fleet insights"
      />

      <div className="max-w-7xl mx-auto p-6 space-y-12">
        {/* ========================================================
            NATIONAL KPI STAT CARDS
        ======================================================== */}
        <TeslaSection label="National Overview">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

            <TeslaStatCard
              label="Jobs Today"
              value={stats.jobsToday}
            />

            <TeslaStatCard
              label="Jobs This Week"
              value={stats.jobsWeek}
            />

            <TeslaStatCard
              label="Active Customers"
              value={stats.customers}
            />

            <TeslaStatCard
              label="Active Vehicles"
              value={stats.vehicles}
            />

            <TeslaStatCard
              label="Avg Completion Time"
              value={
                stats.avgCompletion
                  ? `${stats.avgCompletion} min`
                  : "—"
              }
            />

            <TeslaStatCard
              label="Photos Uploaded Today"
              value={stats.photosToday}
            />

          </div>
        </TeslaSection>

        {/* ========================================================
            TECH AVAILABILITY (NATIONAL VIEW)
        ======================================================== */}
        <TeslaSection label="Technician Availability">
          <TeslaTechAvailability techs={stats.techAvailability || []} />
        </TeslaSection>

        {/* ========================================================
            7-DAY NATIONAL HISTORY CHART
        ======================================================== */}
        <TeslaSection label="Jobs Completed (Last 7 Days)">
          <TeslaChartCard
            labels={stats.chart.labels}
            values={stats.chart.values}
          />
        </TeslaSection>

        {/* ========================================================
            MARKET PERFORMANCE
        ======================================================== */}
        <TeslaSection label="Market Performance">
          <div className="bg-white rounded-xl divide-y">
            {markets.map((market) => (
              <TeslaListRow
                key={market.id}
                title={market.name}
                subtitle={`${market.today} today • ${market.week} this week`}
                right={
                  <div className="text-right text-xs text-gray-500">
                    {market.techs} techs<br />
                    {market.customers} customers
                  </div>
                }
                onClick={() => {
                  // Will link to market detail page later
                  // /admin/markets/[id]
                }}
              />
            ))}
          </div>
        </TeslaSection>

        <div className="h-20" />
      </div>
    </TeslaLayoutShell>
  );
}
