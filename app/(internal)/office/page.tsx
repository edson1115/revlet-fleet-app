"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TeslaSection } from "@/components/tesla/TeslaSection";
import { TeslaStatusBadge } from "@/components/tesla/TeslaStatusBadge";

export default function OfficeDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    new_requests: 0,
    waiting_approval: 0,
    scheduled: 0,
    in_progress: 0
  });
  const [recent, setRecent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/office/requests", { cache: "no-store" });
        const js = await res.json();
        
        const reqs = js.requests || [];
        
        setStats({
            new_requests: reqs.filter((r: any) => r.status === 'NEW').length,
            waiting_approval: reqs.filter((r: any) => r.status === 'WAITING_APPROVAL').length,
            scheduled: reqs.filter((r: any) => r.status === 'SCHEDULED').length,
            in_progress: reqs.filter((r: any) => r.status === 'IN_PROGRESS').length,
        });

        setRecent(reqs.slice(0, 5));
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
          <h1 className="text-3xl font-bold tracking-tight text-black">Office Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Overview of incoming service requests.</p>
        </div>
        <button 
            onClick={() => router.push("/office/requests/new")}
            className="bg-black text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-gray-800 transition shadow-lg"
        >
            + Create Request
        </button>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div onClick={() => router.push("/office/requests?status=NEW")} className="p-5 bg-white border border-gray-200 rounded-xl shadow-sm cursor-pointer hover:border-blue-500 transition">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">New / Untouched</div>
            <div className="text-4xl font-bold text-blue-600">{stats.new_requests}</div>
        </div>
        
        <div onClick={() => router.push("/office/requests?status=WAITING")} className="p-5 bg-white border border-gray-200 rounded-xl shadow-sm cursor-pointer hover:border-amber-500 transition">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Needs Approval</div>
            <div className="text-4xl font-bold text-amber-500">{stats.waiting_approval}</div>
        </div>

        <div onClick={() => router.push("/office/requests?status=SCHEDULED")} className="p-5 bg-white border border-gray-200 rounded-xl shadow-sm cursor-pointer hover:border-black transition">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Scheduled</div>
            <div className="text-4xl font-bold text-gray-900">{stats.scheduled}</div>
        </div>

        <div className="p-5 bg-gray-900 rounded-xl shadow-sm text-white">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">In Progress</div>
            <div className="text-4xl font-bold">{stats.in_progress}</div>
        </div>
      </div>

      {/* RECENT INCOMING */}
      <TeslaSection label="Recent Incoming">
        <div className="bg-white rounded-xl divide-y border border-gray-100">
            {loading && <div className="p-8 text-center text-gray-400">Loading queue...</div>}
            
            {!loading && recent.length === 0 && (
                <div className="p-8 text-center text-gray-500">No active requests.</div>
            )}

            {recent.map((r) => (
                <div 
                    key={r.id}
                    onClick={() => router.push(`/office/requests/${r.id}`)}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer transition"
                >
                    <div className="flex items-center gap-4">
                         {/* Customer Avatar / Initial */}
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-xs text-gray-500">
                            {r.customer?.name?.[0] || "?"}
                        </div>
                        <div>
                            <div className="font-bold text-gray-900 capitalize flex items-center gap-2">
                                {r.service_title?.replace(/_/g, " ")}
                                {r.created_by_role === 'CUSTOMER' && (
                                    <span className="bg-purple-100 text-purple-700 text-[10px] px-2 py-0.5 rounded uppercase font-bold">Portal</span>
                                )}
                            </div>
                            <div className="text-xs text-gray-500 flex gap-2">
                                <span className="font-bold text-black">{r.customer?.name || "Unknown"}</span>
                                <span>•</span>
                                <span>{r.vehicle?.year} {r.vehicle?.model}</span>
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