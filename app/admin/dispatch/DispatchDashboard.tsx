"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";

export default function DispatchDashboard() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDispatchData() {
      const res = await fetch("/api/dispatch");
      const data = await res.json();
      setRequests(data.requests || []);
      setLoading(false);
    }
    fetchDispatchData();
  }, []);

  if (loading) return <div className="p-8 text-zinc-500 font-bold">Loading Fleet Brain Insights...</div>;

  return (
    <div className="max-w-7xl mx-auto p-8 font-sans">
      <header className="mb-10">
        <h1 className="text-3xl font-black uppercase tracking-tighter italic">Smart Dispatch</h1>
        <p className="text-zinc-500 text-sm">Prioritizing {requests.length} pending requests via Fleet Brain Lite.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {requests.map((req) => (
          <div key={req.id} className="bg-white border border-zinc-200 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition group">
            {/* Risk Header */}
            <div className="flex justify-between items-start mb-4">
              <span className={clsx(
                "px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase",
                req.intelligence.risk_level === 'HIGH' ? "bg-red-100 text-red-700 animate-pulse" : 
                req.intelligence.risk_level === 'ELEVATED' ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
              )}>
                {req.intelligence.risk_level} Risk
              </span>
              <span className="text-[10px] font-bold text-zinc-400">#{req.id.substring(0, 5)}</span>
            </div>

            {/* Vehicle & Service Info */}
            <h3 className="text-xl font-black text-zinc-900 leading-tight mb-1">{req.service_title}</h3>
            <p className="text-sm text-zinc-500 mb-4">{req.vehicles.year} {req.vehicles.make} {req.vehicles.model}</p>

            {/* Fleet Brain Insight Panel */}
            <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-4 mb-6">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">🧠 Intelligence</span>
              </div>
              <p className="text-xs font-bold text-zinc-800 leading-snug">
                {req.intelligence.insight}: Overdue by {req.vehicles.mileage - req.vehicles.last_service_miles} miles.
              </p>
            </div>

            <button className="w-full py-3 bg-black text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-zinc-800 transition">
              Assign Technician
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}