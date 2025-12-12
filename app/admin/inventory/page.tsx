"use client";

import { useEffect, useState } from "react";
import { TeslaHeroBar } from "@/components/tesla/TeslaHeroBar";
import { TeslaSection } from "@/components/tesla/TeslaSection";
import { TeslaListRow } from "@/components/tesla/TeslaListRow";
import { TeslaBarChart } from "@/components/tesla/TeslaBarChart";
import { TeslaTrendChart } from "@/components/tesla/TeslaTrendChart";
import { TeslaDivider } from "@/components/tesla/TeslaDivider";

export default function InventoryDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/inventory", {
      cache: "no-store",
    }).then((r) => r.json());

    if (res.ok) setStats(res.stats);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  if (loading || !stats) return <div className="p-8">Loading inventory…</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-10">

      {/* HERO */}
      <TeslaHeroBar
        title="Fleet Inventory + Tire Usage"
        subtitle="Real-time usage across all markets"
        meta={[
          { label: "Tires in Stock", value: stats.total_stock },
          { label: "Used This Week", value: stats.used_week },
          { label: "Top Size", value: stats.top_size },
          { label: "Vendors", value: stats.vendor_count },
        ]}
      />

      {/* WEEKLY USAGE */}
      <TeslaSection label="Weekly Tire Usage">
        <TeslaTrendChart
          label="Tires Used (7 days)"
          data={stats.usage_week}
        />
      </TeslaSection>

      {/* COMMON TIRE SIZES */}
      <TeslaSection label="Most Common Tire Sizes">
        <TeslaBarChart
          data={stats.top_sizes.map((s: any) => ({
            label: s.size,
            value: s.count,
          }))}
        />
      </TeslaSection>

      {/* MARKET INVENTORY */}
      <TeslaSection label="Market Stock Levels">
        <div className="bg-white rounded-xl divide-y border">
          {stats.market_stock.map((m: any) => (
            <TeslaListRow
              key={m.market}
              title={m.market}
              value={`${m.stock} tires`}
              href={`/admin/inventory/${m.market_id}`}
            />
          ))}
        </div>
      </TeslaSection>

      <TeslaDivider />

      {/* VENDORS */}
      <TeslaSection label="Vendor Breakdown">
        <div className="bg-white rounded-xl divide-y border">
          {stats.vendor_breakdown.map((v: any) => (
            <TeslaListRow
              key={v.vendor}
              title={v.vendor}
              value={`${v.count} tires`}
            />
          ))}
        </div>
      </TeslaSection>
    </div>
  );
}
