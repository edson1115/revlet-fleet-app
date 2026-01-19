"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
// We define the status map locally if you don't have the external file yet to prevent errors
const REQUEST_STATUS: any = {
  NEW: { label: "NEW", bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  SCHEDULED: { label: "SCHEDULED", bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-500" },
  IN_PROGRESS: { label: "IN PROGRESS", bg: "bg-yellow-50", text: "text-yellow-700", dot: "bg-yellow-500", pulse: true },
  COMPLETED: { label: "COMPLETED", bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
  READY_TO_SCHEDULE: { label: "APPROVED", bg: "bg-indigo-50", text: "text-indigo-700", dot: "bg-indigo-500" },
  ATTENTION_REQUIRED: { label: "NEEDS ACTION", bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" }
};

// --- ICONS ---
const IconSearch = () => <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const IconHistory = () => <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

export default function ServiceHistoryClient({ requests }: { requests: any[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "OPEN" | "COMPLETED">("ALL");

  const filteredRequests = requests.filter(r => {
    // 1. Search Logic
    const matchesSearch = 
        r.service_title?.toLowerCase().includes(search.toLowerCase()) ||
        r.vehicle?.plate?.toLowerCase().includes(search.toLowerCase()) ||
        r.vehicle?.model?.toLowerCase().includes(search.toLowerCase()) ||
        (r.description && r.description.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    // 2. Status Filter Logic
    if (statusFilter === "COMPLETED") return r.status === 'COMPLETED';
    if (statusFilter === "OPEN") return r.status !== 'COMPLETED';

    return true;
  });

  return (
    <div className="min-h-screen bg-[#F4F5F7] flex flex-col font-sans text-zinc-900 pb-20">
      
      {/* 1️⃣ PREMIUM HEADER */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/80 border-b border-zinc-200/60 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-6 h-18 flex justify-between items-center py-4">
           <div className="flex flex-col">
              <h1 className="text-base font-bold text-zinc-900 leading-tight">Service History</h1>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-mono">
                  Full Audit Log
              </span>
           </div>
        </div>
      </header>

      {/* 2️⃣ MAIN CONTENT */}
      <main className="max-w-7xl mx-auto w-full px-6 py-8 space-y-6">
        
        {/* CONTROLS TOOLBAR */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            
            {/* Segmented Filter Tabs */}
            <div className="bg-zinc-100 p-1 rounded-lg flex border border-zinc-200/50">
                {["ALL", "OPEN", "COMPLETED"].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setStatusFilter(tab as any)}
                        className={clsx(
                            "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                            statusFilter === tab 
                                ? "bg-white shadow-sm text-black ring-1 ring-black/5" 
                                : "text-zinc-400 hover:text-black hover:bg-zinc-200/50"
                        )}
                    >
                        {tab.charAt(0) + tab.slice(1).toLowerCase()}
                    </button>
                ))}
            </div>

            {/* Search Input */}
            <div className="relative group w-full md:w-auto">
                <input 
                    type="text" 
                    placeholder="Search VIN, Service, or details..." 
                    className="pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-black/5 focus:border-zinc-400 outline-none w-full md:w-72 transition shadow-sm group-hover:shadow-md group-hover:border-zinc-300"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <div className="absolute left-3 top-2.5">
                    <IconSearch />
                </div>
            </div>
        </div>

        {/* TABLE CARD */}
        <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden ring-1 ring-black/5">
           <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                 <thead className="bg-zinc-50/50 border-b border-zinc-100">
                    <tr>
                       <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Date</th>
                       <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Vehicle</th>
                       <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Service</th>
                       <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Status</th>
                       <th className="px-6 py-4 text-right"></th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-zinc-50">
                    {filteredRequests.length === 0 ? (
                       <tr>
                          <td colSpan={5} className="px-6 py-20 text-center">
                             <div className="flex flex-col items-center justify-center gap-3">
                                <div className="bg-zinc-50 p-4 rounded-full border border-zinc-100"><IconHistory /></div>
                                <p className="font-medium text-zinc-900 text-sm">No records found</p>
                                <p className="text-xs text-zinc-400">Try adjusting your filters.</p>
                             </div>
                          </td>
                       </tr>
                    ) : (
                       filteredRequests.map((r) => {
                          const hasVehicle = !!r.vehicle;
                          const title = hasVehicle 
                             ? `${r.vehicle.year} ${r.vehicle.model}` 
                             : "No Vehicle Assigned"; 
                          const plate = hasVehicle ? r.vehicle.plate : "N/A";

                          // ⚡️ STATUS CONFIGURATION
                          let statusKey = r.status || "NEW";
                          let statusConfig = REQUEST_STATUS[statusKey] || REQUEST_STATUS.NEW;

                          return (
                             <tr 
                                key={r.id} 
                                onClick={() => router.push(`/customer/requests/${r.id}`)}
                                className="hover:bg-zinc-50/80 transition cursor-pointer group"
                             >
                                <td className="px-6 py-4 text-xs font-medium text-zinc-500 tabular-nums">
                                   {new Date(r.created_at).toLocaleDateString()}
                                </td>
                                
                                <td className="px-6 py-4">
                                   <div className="font-bold text-zinc-900 text-sm group-hover:text-blue-600 transition-colors">{title}</div>
                                   <div className="text-[10px] font-mono text-zinc-500 bg-zinc-100 inline-block px-1.5 py-0.5 rounded mt-1">{plate}</div>
                                </td>

                                <td className="px-6 py-4">
                                   <div className="font-bold text-zinc-800 text-sm">{r.service_title}</div>
                                   <div className="text-[11px] text-zinc-400 mt-0.5 truncate max-w-[200px]">{r.description || "No description provided"}</div>
                                </td>

                                <td className="px-6 py-4">
                                   <span className={clsx(
                                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border border-transparent",
                                      statusConfig.bg,
                                      statusConfig.text
                                   )}>
                                      <div className={clsx(
                                         "w-1.5 h-1.5 rounded-full",
                                         statusConfig.dot,
                                         statusConfig.pulse && "animate-pulse"
                                      )} />
                                      {statusConfig.label}
                                   </span>
                                </td>

                                <td className="px-6 py-4 text-right">
                                   <div className="w-8 h-8 rounded-full bg-white border border-zinc-200 flex items-center justify-center shadow-sm text-zinc-300 group-hover:border-black group-hover:text-black transition ml-auto">
                                         <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                   </div>
                                </td>
                             </tr>
                          );
                       })
                    )}
                 </tbody>
              </table>
           </div>
        </div>
      </main>
    </div>
  );
}