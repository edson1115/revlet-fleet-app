"use client";

import { useEffect, useState } from "react";
import { TeslaHeroBar } from "@/components/tesla/TeslaHeroBar";

export default function SalesKPIsPage() {
  const [stats, setStats] = useState<any>(null);

  async function load() {
    const r = await fetch("/api/sales/kpis", { cache: "no-store" }).then(r => r.json());
    if (r.ok) setStats(r.stats);
  }

  useEffect(() => {
    load();
  }, []);

  if (!stats) {
    return <div className="p-10 text-gray-500">Loading KPIs…</div>;
  }

  return (
    <div className="space-y-10 p-8 max-w-6xl mx-auto">

      <TeslaHeroBar title="Sales KPIs" subtitle="Performance metrics for your team" />

      {/* KPI GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="text-xs text-gray-500">New Leads</div>
          <div className="text-2xl font-semibold">{stats.new_leads}</div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="text-xs text-gray-500">Visits Logged</div>
          <div className="text-2xl font-semibold">{stats.total_visits}</div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="text-xs text-gray-500">Conversion Rate</div>
          <div className="text-2xl font-semibold">
            {stats.conversion_rate}% 
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="text-xs text-gray-500">Avg Days to Convert</div>
          <div className="text-2xl font-semibold">
            {stats.avg_days_to_convert || "—"}
          </div>
        </div>
      </div>

      {/* REP RANKINGS */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Top Reps</h3>

        <div className="space-y-2 bg-white rounded-xl divide-y">
          {stats.rep_rankings.map((rep: any) => (
            <div key={rep.user_id} className="flex justify-between p-4">
              <div>
                <div className="font-medium">{rep.user_name}</div>
                <div className="text-xs text-gray-500">{rep.market}</div>
              </div>

              <div className="text-right">
                <div className="font-semibold">{rep.converted}</div>
                <div className="text-xs text-gray-500">Converted</div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
