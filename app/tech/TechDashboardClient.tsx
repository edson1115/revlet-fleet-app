"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";

// --- ICONS ---
const IconLogout = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
const IconBox = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>;
const IconChevron = () => <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>;
const IconCheck = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>;

export default function TechDashboardClient({ requests }: { requests: any[] }) {
  const router = useRouter();
  const [showLoadout, setShowLoadout] = useState(false);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "No Date";
    return new Date(dateString).toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric' });
  };

  async function handleLogout() {
      await fetch("/api/auth/signout", { method: "POST" });
      router.push("/login");
  }

  // Smart Loadout Logic
  const loadoutList = useMemo(() => {
    const map = new Map<string, { name: string; number: string; qty: number; jobs: string[] }>();
    requests.forEach(r => {
        if (r.request_parts) {
            r.request_parts.forEach((p: any) => {
                const key = `${p.part_name}-${p.part_number}`;
                const existing = map.get(key);
                if (existing) {
                    existing.qty += (p.quantity || 1);
                    if (!existing.jobs.includes(r.vehicle?.unit_number || r.vehicle?.plate)) {
                        existing.jobs.push(r.vehicle?.unit_number || r.vehicle?.plate);
                    }
                } else {
                    map.set(key, { name: p.part_name, number: p.part_number, qty: p.quantity || 1, jobs: [r.vehicle?.unit_number || r.vehicle?.plate] });
                }
            });
        }
    });
    return Array.from(map.values());
  }, [requests]);

  const totalPartsCount = loadoutList.reduce((acc, item) => acc + item.qty, 0);

  return (
    <div className="min-h-screen bg-[#f3f4f6] pb-20 font-sans">
      
      {/* MOBILE HEADER */}
      <div className="bg-white px-6 py-5 sticky top-0 z-20 shadow-sm border-b border-gray-100 flex justify-between items-center">
        <div className="flex items-center gap-3">
             <div className="bg-black text-white px-2 py-0.5 rounded text-lg font-black tracking-tighter italic">
                R
            </div>
            <div>
                <h1 className="font-bold text-gray-900 leading-none">Technician</h1>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{requests.length} Jobs Today</p>
            </div>
        </div>
        <button onClick={handleLogout} className="p-2 bg-gray-100 rounded-full text-gray-500 hover:text-black transition">
            <IconLogout />
        </button>
      </div>

      {/* LOADOUT BUTTON */}
      {totalPartsCount > 0 && (
          <div className="max-w-xl mx-auto px-4 mt-6">
            <button 
                onClick={() => setShowLoadout(true)}
                className="w-full bg-amber-400 hover:bg-amber-500 text-black p-5 rounded-2xl shadow-lg shadow-amber-400/20 flex items-center justify-between transition active:scale-[0.98]"
            >
                <div className="flex items-center gap-4">
                    <div className="bg-black/10 p-2 rounded-full"><IconBox /></div>
                    <div className="text-left">
                        <div className="font-black text-lg leading-none uppercase tracking-wide">Daily Loadout</div>
                        <div className="text-xs font-bold text-black/60 mt-1">{totalPartsCount} Items to Grab</div>
                    </div>
                </div>
                <div className="bg-white/20 px-4 py-1.5 rounded-lg font-bold text-sm backdrop-blur-sm">View &rarr;</div>
            </button>
          </div>
      )}

      {/* JOB LIST */}
      <div className="max-w-xl mx-auto p-4 space-y-4 mt-2">
        {requests.length === 0 && (
            <div className="text-center py-20 opacity-50">
                <div className="text-4xl mb-4">☕️</div>
                <h3 className="text-lg font-bold text-gray-900">All caught up!</h3>
                <p className="text-sm text-gray-500">No jobs assigned to you.</p>
            </div>
        )}

        {requests.map((r) => {
          const isStarted = r.status === "IN_PROGRESS";
          const hasParts = r.request_parts && r.request_parts.length > 0;

          return (
            <div 
              key={r.id}
              onClick={() => router.push(`/tech/requests/${r.id}`)}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 active:scale-[0.98] transition-transform duration-100 cursor-pointer overflow-hidden"
            >
              <div className="flex justify-between items-center px-5 py-3 border-b border-gray-50 bg-gray-50/50">
                 <div className="flex items-center gap-2">
                    <div className={clsx("w-2 h-2 rounded-full", isStarted ? "bg-green-500 animate-pulse" : "bg-blue-500")} />
                    <span className={clsx("text-xs font-bold uppercase tracking-wider", isStarted ? "text-green-700" : "text-blue-600")}>
                        {isStarted ? "In Progress" : "Scheduled"}
                    </span>
                 </div>
                 <span className="text-xs font-mono font-bold text-gray-400">{formatDate(r.scheduled_start_at)}</span>
              </div>
              <div className="p-5">
                 <div className="flex justify-between items-start mb-3">
                    <div>
                        <h3 className="text-lg font-black text-gray-900 leading-tight mb-1">{r.service_title}</h3>
                        <div className="text-sm font-medium text-gray-500">{r.vehicle?.year} {r.vehicle?.model}</div>
                        {r.vehicle?.unit_number && (
                            <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px] font-bold border border-gray-200 mt-2 inline-block">
                                UNIT {r.vehicle.unit_number}
                            </span>
                        )}
                    </div>
                    <div className="bg-gray-50 p-2 rounded-full text-gray-400">
                        <IconChevron />
                    </div>
                 </div>
                 
                 <div className="flex gap-2 mt-4">
                    <div className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-bold">
                        {r.customer?.name}
                    </div>
                    {hasParts && (
                        <div className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-1.5 rounded-lg text-xs font-bold border border-amber-100">
                           <IconBox /> Parts
                        </div>
                    )}
                 </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* LOADOUT MODAL */}
      {showLoadout && (
          <div className="fixed inset-0 bg-black/80 z-50 overflow-y-auto pb-20 backdrop-blur-sm animate-in fade-in">
              <div className="bg-amber-400 p-6 sticky top-0 flex justify-between items-center shadow-lg z-10">
                 <div className="flex items-center gap-3 text-black">
                    <div className="bg-black/10 p-2 rounded-full"><IconBox /></div>
                    <h2 className="font-black text-xl uppercase tracking-wide">Daily Loadout</h2>
                 </div>
                 <button onClick={() => setShowLoadout(false)} className="text-sm font-bold bg-black/10 px-4 py-2 rounded-lg hover:bg-black/20 text-black">Close</button>
              </div>
              
              <div className="max-w-lg mx-auto p-4 space-y-3 mt-4">
                 {loadoutList.map((item, i) => (
                    <div key={i} className="bg-white p-5 rounded-2xl shadow-lg flex justify-between items-center">
                       <div>
                          <div className="font-black text-lg text-gray-900">{item.name}</div>
                          <div className="text-sm font-mono text-gray-500 mb-2">#{item.number || "N/A"}</div>
                          <div className="flex flex-wrap gap-1">
                             {item.jobs.map((unit, idx) => (
                                 <span key={idx} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200 font-bold">
                                     {unit}
                                 </span>
                             ))}
                          </div>
                       </div>
                       <div className="bg-gray-50 h-14 w-14 rounded-xl flex flex-col items-center justify-center border border-gray-200 shrink-0 ml-4">
                          <span className="text-2xl font-black text-black">{item.qty}</span>
                       </div>
                    </div>
                 ))}

                 <button 
                    onClick={() => setShowLoadout(false)}
                    className="w-full bg-white text-black py-4 rounded-xl font-bold text-lg mt-8 shadow-lg flex items-center justify-center gap-2"
                 >
                    <IconCheck /> I Have Everything
                 </button>
              </div>
          </div>
      )}

    </div>
  );
}