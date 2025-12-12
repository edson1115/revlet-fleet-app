"use client";

import { useEffect, useState } from "react";
import TeslaLayoutShell from "@/components/tesla/layout/TeslaLayoutShell";
import { TeslaHeroBar } from "@/components/tesla/TeslaHeroBar";
import { TeslaSection } from "@/components/tesla/TeslaSection";
import { TeslaStatCard } from "@/components/tesla/TeslaStatCard";
import { TeslaTechAvailability } from "@/components/tesla/dispatch/TeslaTechAvailability";

export default function DispatchDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);

    const res = await fetch("/api/dispatch/dashboard", { cache: "no-store" });
    const js = await res.json();

    if (js.ok) {
      setStats(js);
    }

    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  if (loading || !stats) {
    return (
      <TeslaLayoutShell>
        <div className="p-10 text-center text-gray-500">Loading dispatch dashboard…</div>
      </TeslaLayoutShell>
    );
  }

  return (
    <TeslaLayoutShell>
      {/* HEADER BAR */}
      <TeslaHeroBar
        title="Dispatch Dashboard"
        subtitle="Real-time overview of all active jobs across markets"
      />

      <div className="max-w-6xl mx-auto p-6 space-y-10">
        {/* STATS */}
        <TeslaSection label="Current Status">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

            <TeslaStatCard
              label="Unassigned"
              value={stats.unassigned}
              color="red"
            />

            <TeslaStatCard
              label="Scheduled Today"
              value={stats.scheduled_today}
              color="blue"
            />

            <TeslaStatCard
              label="In Progress"
              value={stats.in_progress}
              color="amber"
            />

            <TeslaStatCard
              label="Active Techs"
              value={stats.active_techs}
              color="green"
            />

          </div>
        </TeslaSection>

        {/* TECH AVAILABILITY */}
        <TeslaSection label="Technician Availability">
          <TeslaTechAvailability techs={stats.techs} />
        </TeslaSection>

      </div>
    </TeslaLayoutShell>
  );
}
