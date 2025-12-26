"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TeslaSection } from "@/components/tesla/TeslaSection";
import { TeslaStatusBadge } from "@/components/tesla/TeslaStatusBadge";

// Helper: "general_inspection" -> "General Inspection"
function formatTitle(t: string) {
  if (!t) return "Service Request";
  return t.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
}

export default function OfficeRequestsClient() {
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/office/requests", { cache: "no-store" })
      .then((res) => res.json())
      .then((js) => setRequests(js.requests || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between border-b border-gray-100 pb-6">
        <div>
            <h1 className="text-3xl font-bold tracking-tight text-black">Incoming Requests</h1>
            <p className="text-gray-500 text-sm mt-1">Manage and dispatch new service jobs.</p>
        </div>
        <button 
            onClick={() => router.push("/office/requests/new")}
            className="bg-black text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-gray-800 transition shadow-lg"
        >
            + New Request
        </button>
      </div>

      <TeslaSection label="Request Queue">
        <div className="bg-white rounded-xl divide-y border border-gray-100">
            {loading && <div className="p-8 text-center text-gray-400">Loading queue...</div>}
            
            {!loading && requests.length === 0 && (
                <div className="p-12 text-center text-gray-500">All caught up! No open requests.</div>
            )}

            {requests.map((r) => (
                <div 
                    key={r.id}
                    onClick={() => router.push(`/office/requests/${r.id}`)}
                    className="group flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer transition"
                >
                    <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${r.status === 'NEW' ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'}`} />
                        <div>
                            <div className="font-bold text-gray-900 text-lg flex items-center gap-2">
                                {formatTitle(r.service_title)}
                                {r.created_by_role === 'CUSTOMER' && (
                                    <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                                        Portal
                                    </span>
                                )}
                            </div>
                            <div className="text-sm text-gray-500 flex gap-2">
                                <span className="font-medium text-black">{r.customer?.name || "Unknown Customer"}</span>
                                <span className="text-gray-300">|</span>
                                <span>{r.vehicle?.year} {r.vehicle?.make} {r.vehicle?.model}</span>
                                <span className="text-gray-300">•</span>
                                <span className="font-mono text-xs border px-1 rounded bg-gray-50">{r.vehicle?.plate || "NO PLATE"}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                        <TeslaStatusBadge status={r.status} />
                        <span className="text-gray-300 group-hover:text-black transition text-xl">›</span>
                    </div>
                </div>
            ))}
        </div>
      </TeslaSection>
    </div>
  );
}