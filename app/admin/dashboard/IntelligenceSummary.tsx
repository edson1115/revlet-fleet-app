"use client";

import { calculateVehicleRisk } from "@/lib/intelligence";
import clsx from "clsx";

export default function IntelligenceSummary({ vehicles }: { vehicles: any[] }) {
  // Logic: Aggregate vehicle data into actionable insights
  const highRiskVehicles = vehicles.filter(v => 
    calculateVehicleRisk(v.mileage, v.last_service_miles, v.last_service_date).level === 'HIGH'
  );

  const fleetHealth = Math.round(((vehicles.length - highRiskVehicles.length) / vehicles.length) * 100);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
      {/* 1. THE NORTH STAR METRIC (Gap A) */}
      <div className="bg-zinc-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Fleet Health Index</span>
          <div className="flex items-baseline gap-2 mt-2">
            <h2 className="text-6xl font-black italic tracking-tighter">{fleetHealth}%</h2>
            <span className="text-emerald-400 font-bold text-xs uppercase">Optimal</span>
          </div>
          <p className="text-zinc-400 text-xs mt-4 font-medium italic">"Revlet is currently protecting {vehicles.length - highRiskVehicles.length} of your assets."</p>
        </div>
        {/* Abstract background pulse for "Intelligence" feel */}
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-blue-600/20 rounded-full blur-3xl" />
      </div>

      {/* 2. PREDICTIVE TRIAGE (Gap B: Autonomous Ops) */}
      <div className="bg-white p-8 rounded-[3rem] border border-zinc-200 shadow-sm flex flex-col justify-between">
        <div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">High-Risk Triage</span>
            <h2 className="text-4xl font-black text-zinc-900 mt-2">{highRiskVehicles.length}</h2>
            <p className="text-zinc-500 text-xs font-bold uppercase mt-1">Vehicles Flagged for Failure</p>
        </div>
        <button className="mt-6 w-full py-3 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition">
            View Risk List
        </button>
      </div>

      {/* 3. THE REVENUE MOAT (Gap C: Trust) */}
      <div className="bg-blue-600 p-8 rounded-[3rem] text-white shadow-xl flex flex-col justify-between">
        <div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-200">Uptime Efficiency</span>
            <h2 className="text-4xl font-black mt-2">98.4%</h2>
            <p className="text-blue-100 text-xs font-bold uppercase mt-1">Avg. Availability</p>
        </div>
        <div className="mt-4 flex gap-1">
            {[1,2,3,4,5,6,7].map(i => (
                <div key={i} className="h-8 flex-1 bg-white/20 rounded-md flex items-end">
                    <div className="w-full bg-white rounded-md" style={{ height: `${Math.random() * 100}%` }} />
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}