"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { use } from "react"; // Needed for unwrapping params in Next.js 15+

import { TeslaHeroBar } from "@/components/tesla/TeslaHeroBar";
import { TeslaSection } from "@/components/tesla/TeslaSection";
import { TeslaListRow } from "@/components/tesla/TeslaListRow";
import { TeslaStatusChip } from "@/components/tesla/TeslaStatusChip";

export default function MarketDetailPage({ params }: any) {
  // Unwrap params properly for Next.js 15
  const unwrappedParams: any = use(params);
  const marketId = unwrappedParams.id;
  
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [market, setMarket] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);

  async function load() {
    setLoading(true);
    try {
        const res = await fetch(`/api/admin/markets/${marketId}`, {
          cache: "no-store",
        }).then((r) => r.json());

        if (res.ok) {
          setMarket(res.market);
          setStats(res.stats);
        } else {
           // Fallback if ID is invalid
           setMarket({ name: "Unknown Market", performance: "N/A" });
           setStats({ techs: 0, customers: 0, vehicles: 0, today: 0, status_counts: {}, tech_list: [], customer_list: [] });
        }
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [marketId]);

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
         <div className="h-40 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 italic text-sm">
             Activity Chart Loading...
         </div>
      </TeslaSection>

      {/* STATUS BREAKDOWN */}
      <TeslaSection label="Jobs by Status">
        <div className="bg-white rounded-xl divide-y border">
          {jobsByStatus.length === 0 && (
             <div className="p-4 text-gray-400 italic text-sm">No jobs found.</div>
          )}
          {jobsByStatus.map((row: any) => (
            <TeslaListRow
              key={row.status}
              title={row.status.replace(/_/g, " ")}
              subtitle={`${row.count} Jobs`}
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
         <div className="p-4 text-gray-400 italic text-sm">
             Vehicle list loading...
         </div>
      </TeslaSection>
    </div>
  );
}