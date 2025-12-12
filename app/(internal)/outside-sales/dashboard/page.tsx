"use client";

import { useEffect, useState } from "react";
import { TeslaHeroBar } from "@/components/tesla/TeslaHeroBar";
import { TeslaSection } from "@/components/tesla/TeslaSection";

export default function OutsideSalesDashboard() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const r = await fetch("/api/outside-sales/stats").then((r) => r.json());
      if (r.ok) setStats(r);
    }
    load();
  }, []);

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <TeslaHeroBar title="Outside Sales Dashboard" subtitle="Lead performance" />

      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <TeslaSection label="Your Stats">
          {!stats && <div className="py-6 text-gray-400">Loading…</div>}

          {stats && (
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold">{stats.total}</div>
                <div className="text-gray-500 text-sm">Total Leads</div>
              </div>

              <div>
                <div className="text-3xl font-bold">{stats.active}</div>
                <div className="text-gray-500 text-sm">Active Leads</div>
              </div>

              <div>
                <div className="text-3xl font-bold">{stats.converted}</div>
                <div className="text-gray-500 text-sm">Converted</div>
              </div>
            </div>
          )}
        </TeslaSection>
      </div>
    </div>
  );
}
