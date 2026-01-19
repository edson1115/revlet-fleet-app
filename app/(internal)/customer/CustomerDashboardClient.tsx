"use client";

import { useRouter } from "next/navigation";
import clsx from "clsx";

// --- ICONS ---
const IconPlus = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;
const IconWrench = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;

export default function CustomerDashboardClient({ requests, customerName }: { requests: any[], customerName: string }) {
  const router = useRouter();
  
  // 1. "Action Needed" (Requires Customer Attention)
  const actionItems = requests.filter(r => 
      r.status === 'PENDING' || 
      r.status === 'PROBLEM' || 
      r.status === 'READY_TO_SCHEDULE'
  );

  // 2. "Active / Monitoring" (Waiting on Office or Tech)
  // ✅ FIXED: Added 'NEW' so tire orders show up here
  const activeItems = requests.filter(r => 
      r.status === 'IN_PROGRESS' || 
      r.status === 'SCHEDULED' || 
      r.status === 'NEW'
  );
  
  const totalActive = actionItems.length + activeItems.length;

  return (
    <div className="space-y-8 px-6 py-10">
       
       {/* HEADER + TILES */}
       <div className="space-y-6">
           <div>
              <h1 className="text-3xl font-black tracking-tight text-gray-900">{customerName}</h1>
              <p className="text-gray-500 font-medium">Fleet Overview</p>
           </div>

           {/* 🟢 QUICK ACTIONS */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               
               <button onClick={() => router.push('/customer/requests/new')} className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm hover:shadow-md hover:border-black/20 transition text-left group">
                   <div className="bg-black text-white w-10 h-10 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition shadow-lg shadow-black/20">
                       <IconPlus />
                   </div>
                   <div className="font-bold text-zinc-900">Request Service</div>
                   <div className="text-xs text-zinc-500 mt-1">Report an issue</div>
               </button>

               <button onClick={() => router.push('/customer/tires')} className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm hover:shadow-md hover:border-black/20 transition text-left group">
                   <div className="bg-zinc-100 text-zinc-600 w-10 h-10 rounded-xl flex items-center justify-center mb-3 group-hover:bg-zinc-200 transition">
                       <IconWrench />
                   </div>
                   <div className="font-bold text-zinc-900">Order Tires</div>
                   <div className="text-xs text-zinc-500 mt-1">Browse catalog</div>
               </button>

               {/* KPI TILE */}
               <div className="bg-zinc-900 p-6 rounded-2xl border border-black shadow-sm flex flex-col justify-center">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Total Active</span>
                    <span className="text-3xl font-black text-white">{totalActive} Jobs</span>
               </div>
           </div>
       </div>

       {/* ACTION SECTION (Red Alert) */}
       {actionItems.length > 0 && (
           <div className="space-y-4">
               <h2 className="text-sm font-black text-red-600 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
                  Action Required ({actionItems.length})
               </h2>
               <div className="grid gap-4 md:grid-cols-2">
                  {actionItems.map(r => {
                      const notes = r.technician_notes || "";
                      const redCount = (notes.match(/🔴/g) || []).length;
                      const yellowCount = (notes.match(/🟡/g) || []).length;

                      return (
                          <div key={r.id} onClick={() => router.push(`/customer/requests/${r.id}`)} className="bg-white p-5 rounded-2xl border border-red-100 shadow-lg shadow-red-900/5 cursor-pointer hover:border-red-300 transition group">
                              <div className="flex justify-between items-start mb-2">
                                 <span className="bg-red-100 text-red-700 text-[10px] font-black px-2 py-1 rounded uppercase">{r.status.replace("_", " ")}</span>
                                 <span className="text-gray-400 group-hover:translate-x-1 transition">→</span>
                              </div>
                              <div className="font-bold text-lg text-gray-900">{r.vehicle ? `${r.vehicle.year} ${r.vehicle.model}` : "Fleet Order"}</div>
                              <div className="text-sm text-gray-500 mb-4">{r.vehicle ? `Unit #${r.vehicle.unit_number || "N/A"}` : "Stock / Drop Ship"}</div>
                              
                              <div className="flex justify-between items-end">
                                  <div className="text-sm font-medium text-gray-800">{r.service_title}</div>
                                  {(redCount > 0 || yellowCount > 0) && (
                                     <div className="flex gap-1">
                                         {redCount > 0 && <span className="bg-red-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded flex items-center gap-1">🔴 {redCount} Urgent</span>}
                                         {yellowCount > 0 && <span className="bg-amber-400 text-black text-[10px] font-black px-1.5 py-0.5 rounded">🟡 {yellowCount}</span>}
                                     </div>
                                  )}
                              </div>
                          </div>
                      );
                  })}
               </div>
           </div>
       )}

       {/* ACTIVE LIST (Monitoring) */}
       <div className="space-y-4">
           <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest">In Progress / Requested</h2>
           <div className="bg-white rounded-2xl border border-zinc-200 divide-y divide-zinc-100 shadow-sm">
               {activeItems.length === 0 ? (
                   <div className="p-8 text-center text-gray-400 text-sm">No active maintenance at the moment.</div>
               ) : (
                   activeItems.map(r => {
                       const notes = r.technician_notes || "";
                       const redCount = (notes.match(/🔴/g) || []).length;
                       // Handle "No Vehicle" cases safely
                       const vehicleText = r.vehicle ? `${r.vehicle.year} ${r.vehicle.model}` : "Stock Order";

                       return (
                           <div key={r.id} onClick={() => router.push(`/customer/requests/${r.id}`)} className="p-5 flex justify-between items-center hover:bg-zinc-50 transition cursor-pointer">
                               <div>
                                   <div className="font-bold text-gray-900 flex items-center gap-2">
                                       {vehicleText}
                                       {redCount > 0 && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title="Needs Attention"></span>}
                                   </div>
                                   <div className="text-xs text-gray-500 mt-1 uppercase tracking-wide">
                                      {r.status === 'IN_PROGRESS' ? (
                                          <span className="text-green-600 font-bold flex items-center gap-1">● In Repair</span>
                                      ) : r.status === 'NEW' ? (
                                          <span className="text-blue-600 font-bold flex items-center gap-1">● Requested (Sent to Dispatch)</span>
                                      ) : (
                                          <span>Scheduled: {r.scheduled_start_at ? new Date(r.scheduled_start_at).toLocaleDateString() : "TBD"}</span>
                                      )}
                                   </div>
                               </div>
                               <div className="text-right">
                                   <div className="text-sm font-medium text-gray-900">{r.service_title}</div>
                                   <div className="text-xs text-gray-400">{r.technician?.full_name || "Unassigned"}</div>
                               </div>
                           </div>
                       );
                   })
               )}
           </div>
       </div>
    </div>
  );
}