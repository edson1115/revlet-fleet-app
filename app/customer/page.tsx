"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TeslaSection } from "@/components/tesla/TeslaSection";
import { TeslaStatusBadge } from "@/components/tesla/TeslaStatusBadge";

export default function CustomerDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    active_requests: 0,
    waiting_approval: 0,
    total_vehicles: 0,
  });
  const [recent, setRecent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [reqRes, vehRes] = await Promise.all([
            fetch("/api/customer/requests", { cache: "no-store" }),
            fetch("/api/customer/vehicles", { cache: "no-store" })
        ]);

        const reqData = await reqRes.json();
        const vehData = await vehRes.json();

        const requests = reqData.rows || [];
        const vehicles = vehData.vehicles || [];

        setStats({
            active_requests: requests.filter((r: any) => r.status !== 'COMPLETED').length,
            waiting_approval: requests.filter((r: any) => r.status === 'WAITING').length,
            total_vehicles: vehicles.length
        });

        setRecent(requests.slice(0, 5));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-8 pb-20">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-black">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Overview of your fleet activity.</p>
        </div>
        
        {/* ✅ NEW BUTTONS: ORDER TIRES + NEW REQUEST */}
        <div className="flex gap-2">
            <button 
                onClick={() => router.push("/customer/requests/tire-purchase")}
                className="bg-gray-100 text-black px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-200 transition"
            >
                Order Tires
            </button>
            <button 
                onClick={() => router.push("/customer/requests/new")}
                className="bg-black text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-gray-800 transition shadow-lg"
            >
                + New Request
            </button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. Active Repairs */}
        <div 
            onClick={() => router.push("/customer/requests")}
            className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-black transition cursor-pointer"
        >
            <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Active Repairs</div>
            <div className="text-4xl font-bold text-black">{stats.active_requests}</div>
        </div>

        {/* 2. Waiting */}
        <div 
            onClick={() => router.push("/customer/requests")}
            className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-amber-500 transition cursor-pointer"
        >
            <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Waiting Approval</div>
            <div className="text-4xl font-bold text-amber-600">{stats.waiting_approval}</div>
        </div>

        {/* 3. Total Fleet */}
        <div 
            onClick={() => router.push("/customer/vehicles")}
            className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-blue-600 transition cursor-pointer group"
        >
            <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Total Fleet</div>
            <div className="text-4xl font-bold text-gray-900">{stats.total_vehicles}</div>
            <div className="text-xs text-blue-600 mt-2 font-medium group-hover:underline">Manage & Add Vehicles &rarr;</div>
        </div>
      </div>

      {/* RECENT ACTIVITY */}
      <TeslaSection label="Recent Activity">
        <div className="bg-white rounded-xl divide-y border border-gray-100">
            {loading && <div className="p-6 text-center text-gray-400">Loading...</div>}
            
            {!loading && recent.length === 0 && (
                <div className="p-8 text-center text-gray-500">No recent activity.</div>
            )}

            {recent.map((r) => (
                <div 
                    key={r.id} 
                    onClick={() => router.push(`/customer/requests/${r.id}`)}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer transition"
                >
                    <div className="flex items-center gap-4">
                        <div className={`w-2 h-2 rounded-full ${r.status === 'COMPLETED' ? 'bg-green-500' : 'bg-blue-500'}`} />
                        <div>
                            <div className="font-bold text-sm text-gray-900 capitalize">
                                {r.service_title?.replace(/_/g, " ") || "Service Request"}
                            </div>
                            <div className="text-xs text-gray-500 flex gap-2">
                                <span>{r.vehicle?.year} {r.vehicle?.make} {r.vehicle?.model}</span>
                                <span className="text-gray-300">•</span>
                                <span className="font-mono">{r.vehicle?.plate || "NO PLATE"}</span>
                            </div>
                        </div>
                    </div>
                    <TeslaStatusBadge status={r.status} />
                </div>
            ))}
        </div>
      </TeslaSection>
    </div>
  );
}