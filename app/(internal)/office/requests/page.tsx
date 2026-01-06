"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TeslaSection } from "@/components/tesla/TeslaSection";
import { TeslaStatusBadge } from "@/components/tesla/TeslaStatusBadge";

// Helper for title formatting
function formatTitle(t: string) {
  if (!t) return "Service Request";
  return t.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
}

export default function OfficeRequestsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filterStatus = searchParams.get("status"); // e.g. "NEW"

  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/office/requests", { cache: "no-store" })
      .then((res) => res.json())
      .then((js) => setRequests(js.requests || []))
      .finally(() => setLoading(false));
  }, []);

  // Filter Logic: Split into "Action Required" vs "Others"
  const { inbox, pipeline } = useMemo(() => {
    const inbox: any[] = [];
    const pipeline: any[] = [];

    requests.forEach(r => {
      // If URL filter is active (e.g. ?status=NEW), only show that
      if (filterStatus && r.status !== filterStatus) return;

      // Otherwise, use smart grouping
      if (['NEW', 'WAITING'].includes(r.status)) {
        inbox.push(r);
      } else {
        pipeline.push(r);
      }
    });

    return { inbox, pipeline };
  }, [requests, filterStatus]);

  // Reusable Card Component (Matches Customer Portal Look)
  const RequestRow = ({ r }: { r: any }) => (
    <div 
      key={r.id}
      onClick={() => router.push(`/office/requests/${r.id}`)}
      className="group flex items-center justify-between p-5 hover:bg-gray-50 cursor-pointer transition border-l-4 border-transparent hover:border-black"
    >
      <div className="flex items-center gap-5">
        {/* Status Indicator Dot */}
        <div className={`w-3 h-3 rounded-full shadow-sm ${r.status === 'NEW' ? 'bg-blue-600 animate-pulse' : r.status === 'WAITING' ? 'bg-amber-500' : 'bg-gray-300'}`} />
        
        <div>
          <div className="flex items-center gap-3 mb-1">
             <h4 className="font-bold text-gray-900 text-lg">
                {formatTitle(r.service_title)}
             </h4>
             {r.created_by_role === 'CUSTOMER' && (
                <span className="bg-purple-100 text-purple-700 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                  Portal
                </span>
             )}
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-500">
             <span className="font-semibold text-gray-900">{r.customer?.name || "Unknown Customer"}</span>
             <span className="text-gray-300">|</span>
             <span>{r.vehicle?.year} {r.vehicle?.model}</span>
             <span className="text-gray-300">•</span>
             <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-xs text-gray-600 border border-gray-200">
                {r.vehicle?.unit_number ? `Unit ${r.vehicle.unit_number}` : r.vehicle?.plate || "NO ID"}
             </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-right hidden sm:block">
           <p className="text-xs text-gray-400 font-medium uppercase mb-1">Status</p>
           <TeslaStatusBadge status={r.status} />
        </div>
        <span className="text-gray-300 group-hover:text-black transition text-2xl">›</span>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20">
      
      {/* HEADER */}
      <div className="flex items-center justify-between pt-4 pb-2 border-b border-gray-100">
        <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
               <span className="hover:text-black cursor-pointer" onClick={() => router.push('/office')}>Dashboard</span>
               <span>/</span>
               <span className="text-black">Queue</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-black">
                {filterStatus ? `${filterStatus.replace(/_/g, ' ')} Requests` : 'Incoming Requests'}
            </h1>
        </div>
        
        {!filterStatus && (
            <button 
                onClick={() => router.push("/office/requests/new")}
                className="bg-black text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-gray-800 transition shadow-lg flex items-center gap-2"
            >
                <span>+</span> Create Request
            </button>
        )}
        {filterStatus && (
            <button 
                onClick={() => router.push("/office/requests")}
                className="text-gray-500 hover:text-black text-sm font-bold underline"
            >
                Clear Filter
            </button>
        )}
      </div>

      {loading && <div className="p-12 text-center text-gray-400">Loading requests...</div>}

      {/* SECTION 1: INBOX (The Priority Stuff) */}
      {!loading && (inbox.length > 0 || !filterStatus) && (
        <TeslaSection label={filterStatus ? "Requests" : `⚠️ Action Required (${inbox.length})`}>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100 overflow-hidden">
             {inbox.length === 0 ? (
                <div className="p-10 text-center bg-gray-50">
                   <p className="text-gray-500 font-medium">No new requests pending.</p>
                   <p className="text-sm text-gray-400">Great job! You're all caught up.</p>
                </div>
             ) : (
                inbox.map(r => <RequestRow key={r.id} r={r} />)
             )}
          </div>
        </TeslaSection>
      )}

      {/* SECTION 2: PIPELINE (Everything Else) */}
      {!loading && pipeline.length > 0 && !filterStatus && (
        <TeslaSection label="🗄️ In Pipeline & History">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100 overflow-hidden opacity-90">
             {pipeline.map(r => <RequestRow key={r.id} r={r} />)
             }
          </div>
        </TeslaSection>
      )}

    </div>
  );
}