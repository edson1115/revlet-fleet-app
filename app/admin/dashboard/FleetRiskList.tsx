"use client";

import { calculateVehicleRisk } from "@/lib/intelligence";
import clsx from "clsx";

export default function FleetRiskList({ vehicles }: { vehicles: any[] }) {
  // Logic: Identify only those needing immediate attention
  const highRiskItems = vehicles
    .map(v => ({
      ...v,
      risk: calculateVehicleRisk(v.mileage, v.last_service_miles, v.last_service_date)
    }))
    .filter(item => item.risk.level === 'HIGH')
    .sort((a, b) => b.risk.score - a.risk.score); // Prioritize most critical first

  return (
    <div className="bg-white rounded-[3rem] border border-zinc-200 shadow-sm overflow-hidden">
      <div className="p-8 border-b border-zinc-100 flex justify-between items-center">
        <div>
          <h3 className="text-xl font-black uppercase italic tracking-tight text-zinc-900">Critical Risk Triage</h3>
          <p className="text-zinc-500 text-xs font-bold uppercase mt-1">Immediate action required for {highRiskItems.length} assets</p>
        </div>
        <div className="px-4 py-2 bg-red-50 rounded-2xl">
           <span className="text-red-600 text-[10px] font-black uppercase tracking-widest animate-pulse">Live Monitoring Active</span>
        </div>
      </div>

      <div className="divide-y divide-zinc-50">
        {highRiskItems.length > 0 ? (
          highRiskItems.map((item) => (
            <div key={item.id} className="p-6 hover:bg-zinc-50 transition-colors flex flex-col md:flex-row justify-between items-center gap-4 group">
              <div className="flex items-center gap-6 w-full md:w-auto">
                {/* 📊 Visual Severity Hint */}
                <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center text-xl">⚠️</div>
                <div>
                  <h4 className="font-black text-zinc-900 uppercase tracking-tighter leading-none">
                    {item.year} {item.make} {item.model}
                  </h4>
                  <p className="text-[10px] font-bold text-zinc-400 mt-1 uppercase">
                    Plate: {item.plate || "No Plate"} • VIN: {item.vin?.substring(0, 8) || "N/A"}
                  </p>
                </div>
              </div>

              {/* Intelligence Insight (Gap A) */}
              <div className="flex-1 px-4 text-center md:text-left">
                <p className="text-xs font-bold text-red-600 leading-tight">
                  {item.risk.insight} [Overdue by {(item.mileage - item.last_service_miles).toLocaleString()} mi]
                </p>
              </div>

              <div className="flex items-center gap-4 w-full md:w-auto justify-end">
                <div className="text-right mr-4">
                    <p className="text-lg font-black text-zinc-900 leading-none">{item.risk.score}%</p>
                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Risk Score</p>
                </div>
                <button 
                  onClick={() => window.location.href = `/admin/customers?search=${item.id}`}
                  className="px-6 py-3 bg-zinc-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition shadow-lg active:scale-95"
                >
                  Dispatch
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="p-20 text-center">
            <p className="text-zinc-300 font-black uppercase italic tracking-[0.3em]">Fleet Integrity Verified • 0 Critical Faults</p>
          </div>
        )}
      </div>
    </div>
  );
}