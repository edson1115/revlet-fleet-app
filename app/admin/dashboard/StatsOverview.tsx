"use client";
import { useEffect, useState } from "react";

export default function StatsOverview() {
  const [stats, setStats] = useState({ sharedReportsWeek: 0, fleetHealth: 100, activePilots: 1 });

  useEffect(() => {
    fetch("/api/admin/stats").then(res => res.json()).then(setStats);
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
      {/* Fleet Health Card */}
      <div className="bg-zinc-900 p-8 rounded-[2.5rem] text-white shadow-2xl border border-zinc-800">
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Fleet Health Score</span>
        <div className="flex items-baseline gap-2 mt-2">
          <h2 className="text-5xl font-black italic tracking-tighter">{stats.fleetHealth}%</h2>
          <span className="text-emerald-400 text-xs font-bold">Optimal</span>
        </div>
      </div>

      {/* Trust Metric: Shared Reports */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-zinc-200">
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Reports Shared (7d)</span>
        <div className="flex items-baseline gap-2 mt-2">
          <h2 className="text-5xl font-black italic tracking-tighter text-zinc-900">{stats.sharedReportsWeek}</h2>
          <p className="text-zinc-500 text-xs font-medium">Audit-Ready Docs</p>
        </div>
      </div>

      {/* Market Growth */}
      <div className="bg-blue-600 p-8 rounded-[2.5rem] text-white shadow-xl">
        <span className="text-[10px] font-black uppercase tracking-widest text-blue-200">Active Markets</span>
        <div className="mt-2">
          <h2 className="text-5xl font-black italic tracking-tighter">0{stats.activePilots}</h2>
          <p className="text-blue-100 text-xs font-bold mt-1 uppercase">📍 San Antonio Pilot</p>
        </div>
      </div>
    </div>
  );
}