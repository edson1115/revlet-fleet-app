"use client";

import { useEffect, useState } from "react";
import TeslaLayoutShell from "@/components/tesla/layout/TeslaLayoutShell";
import { TeslaHeroBar } from "@/components/tesla/TeslaHeroBar";
import { TeslaSection } from "@/components/tesla/TeslaSection";
import { TeslaStatCard } from "@/components/tesla/TeslaStatCard";
import { TeslaChartCard } from "@/components/tesla/TeslaChartCard";
import { TeslaListRow } from "@/components/tesla/TeslaListRow";
import { TeslaTechAvailability } from "@/components/tesla/TeslaTechAvailability";
import IntelligenceSummary from "./IntelligenceSummary";
import FleetRiskList from "./FleetRiskList";
import TechLeaderboard from "./TechLeaderboard"; // New Import
import { calculateVehicleRisk } from "@/lib/intelligence";

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [markets, setMarkets] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [alert, setAlert] = useState<{message: string; visible: boolean}>({ message: "", visible: false });

  async function load() {
    setLoading(true);
    try {
      const [analyticsRes, marketsRes, dispatchRes] = await Promise.all([
        fetch("/api/admin/analytics", { cache: "no-store" }),
        fetch("/api/admin/markets", { cache: "no-store" }),
        fetch("/api/dispatch", { cache: "no-store" })
      ]);

      if (analyticsRes.status === 401 || marketsRes.status === 401 || dispatchRes.status === 401) {
        window.location.href = "/login?error=session_expired";
        return;
      }

      const a = await analyticsRes.json();
      const m = await marketsRes.json();
      const d = await dispatchRes.json();

      if (a.stats) setStats(a.stats);
      if (m.markets) setMarkets(m.markets);
      
      if (d.requests) {
        const fleetVehicles = d.requests.map((r: any) => r.vehicles).filter(Boolean);
        setVehicles(fleetVehicles);

        const highRiskVehicles = fleetVehicles.filter((v: any) => {
          const risk = calculateVehicleRisk(v.mileage, v.last_service_miles, v.last_service_date);
          return risk.level === 'HIGH';
        });

        if (highRiskVehicles.length > 0) {
          setAlert({ 
            message: `Predictive Alert: ${highRiskVehicles.length} vehicles identified as 'Likely Next Failure'.`, 
            visible: true 
          });
        }
      }
    } catch (error) {
      console.error("❌ Dashboard Intelligence Sync Error:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading || !stats) {
    return (
      <TeslaLayoutShell>
        <div className="p-20 text-center font-black uppercase italic tracking-[0.4em] text-zinc-400 animate-pulse">
          ESTABLISHING COMMAND CONNECTION...
        </div>
      </TeslaLayoutShell>
    );
  }

  return (
    <TeslaLayoutShell>
      {alert.visible && (
        <div className="fixed top-24 right-6 z-[100] bg-red-600 text-white p-6 rounded-[2rem] shadow-2xl flex items-center gap-4 border-4 border-white animate-in slide-in-from-right-10">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="font-black uppercase text-[10px] tracking-[0.2em] leading-none">Fleet Brain Alert</p>
            <p className="font-bold text-sm mt-1">{alert.message}</p>
          </div>
          <button onClick={() => setAlert({ ...alert, visible: false })} className="ml-4 p-2 hover:bg-white/20 rounded-full font-black">✕</button>
        </div>
      )}

      <TeslaHeroBar title="Executive Command" subtitle="Nationwide performance & predictive fleet intelligence" />

      <div className="max-w-7xl mx-auto p-6 space-y-12">
        <TeslaSection label="Fleet Intelligence Index">
          <IntelligenceSummary vehicles={vehicles} />
        </TeslaSection>

        {/* 🏆 TECHNICIAN PERFORMANCE LEADERBOARD (Gap B) */}
        <TeslaSection label="Top Performing Technicians">
          <TechLeaderboard techs={markets.flatMap(m => m.technicianLeaderboard || [])} />
        </TeslaSection>

        <TeslaSection label="Immediate Risk Triage">
          <FleetRiskList vehicles={vehicles} />
        </TeslaSection>

        <TeslaSection label="National Performance">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <TeslaStatCard label="Jobs Today" value={stats.jobsToday} />
            <TeslaStatCard label="Jobs This Week" value={stats.jobsWeek} />
            <TeslaStatCard label="Active Customers" value={stats.customers} />
            <TeslaStatCard label="Active Vehicles" value={stats.vehicles} />
            <TeslaStatCard label="Avg Completion" value={stats.avgCompletion ? `${stats.avgCompletion} min` : "—"} />
            <TeslaStatCard label="Photos (Audit Proof)" value={stats.photosToday} />
          </div>
        </TeslaSection>

        <TeslaSection label="Regional Market Performance">
          <div className="bg-white rounded-[2rem] border border-zinc-100 divide-y overflow-hidden shadow-sm">
            {markets.map((market: any) => (
              <TeslaListRow
                key={market.id}
                title={market.name}
                subtitle={`${market.today} today • ${market.week} this week`}
                right={<div className="text-right text-[10px] font-black text-zinc-400 uppercase">{market.techs} Techs • {market.customers} Accounts</div>}
                onClick={() => { window.location.href = `/admin/customers?market=${market.name}`; }}
              />
            ))}
          </div>
        </TeslaSection>
        <div className="h-20" />
      </div>
    </TeslaLayoutShell>
  );
}