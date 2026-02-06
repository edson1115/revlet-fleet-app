"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { TeslaHeroBar } from "@/components/tesla/TeslaHeroBar";
import { TeslaSection } from "@/components/tesla/TeslaSection";
import { TeslaListRow } from "@/components/tesla/TeslaListRow";
import { TeslaDivider } from "@/components/tesla/TeslaDivider";
import { TeslaStatusChip } from "@/components/tesla/TeslaStatusChip";

export default function MarketDetailPage({ params }: any) {
  const marketId = params.id;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [market, setMarket] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);

  async function load() {
    setLoading(true);

    const res = await fetch(`/api/admin/markets/${marketId}`, {
      cache: "no-store",
    }).then((r) => r.json());

    if (res.ok) {
      setMarket(res.market);
      setStats(res.stats);
    }

    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  if (loading || !market) {
    return <div className="p-10 text-gray-500">Loading market…</div>;
  }

  const statusGroups = stats?.status_counts || {};

  const jobsByStatus = Object.entries(statusGroups).map(([status, count]) => ({
    status,
    count,
  }));

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-10">

      {/* BACK */}
      <button
        onClick={() => router.push("/admin/markets")}
        className="text-sm text-gray-600 hover:text-black"
      >
        ← Back to Markets
      </button>

      {/* HERO */}
      <TeslaHeroBar
        title={market.name}
        status={market.performance}
        meta={[
          { label: "Techs", value: stats.techs },
          { label: "Customers", value: stats.customers },
          { label: "Vehicles", value: stats.vehicles },
          { label: "Jobs Today", value: stats.today },
        ]}
      />

      {/* PERFORMANCE CHART */}
      <TeslaSection label="Week Activity">
      </TeslaSection>

      {/* STATUS BREAKDOWN */}
      <TeslaSection label="Jobs by Status">
        <div className="bg-white rounded-xl divide-y border">
          {jobsByStatus.map((row) => (
            <TeslaListRow
              key={row.status}
              title={row.status.replace(/_/g, " ")}
              value={row.count}
              accessory={<TeslaStatusChip status={row.status} />}
            />
          ))}
        </div>
      </TeslaSection>

      {/* TECHS */}
      <TeslaSection label="Active Technicians">
        <div className="bg-white rounded-xl divide-y border">
          {stats.tech_list.length === 0 && (
            <div className="text-gray-500 p-4">No techs assigned.</div>
          )}

          {stats.tech_list.map((t: any) => (
            <TeslaListRow
              key={t.id}
              title={t.full_name || "Unnamed Tech"}
              subtitle={t.email}
            />
          ))}
        </div>
      </TeslaSection>

      {/* CUSTOMERS */}
      <TeslaSection label="Active Customers">
        <div className="bg-white rounded-xl divide-y border">
          {stats.customer_list.length === 0 && (
            <div className="text-gray-500 p-4">No active customers.</div>
          )}

          {stats.customer_list.map((c: any) => (
            <TeslaListRow
              key={c.id}
              title={c.name}
              subtitle={c.primary_contact || ""}
            />
          ))}
        </div>
      </TeslaSection>

      {/* VEHICLES */}
      <TeslaSection label="Vehicles In Market">
      </TeslaSection>
    </div>
  );
}
