"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";

// --- ICONS ---
const IconLogout = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
const IconPlus = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;
const IconSearch = () => <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const IconTrend = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;

export default function OfficeDashboardClient({ requests }: { requests: any[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  // --- STATS LOGIC (Preserved from your old file) ---
  const stats = {
    new_requests: requests.filter((r) => r.status === 'NEW').length,
    waiting_approval: requests.filter((r) => r.status === 'WAITING_APPROVAL').length,
    scheduled: requests.filter((r) => r.status === 'SCHEDULED').length,
    in_progress: requests.filter((r) => r.status === 'IN_PROGRESS').length,
  };

  // --- FILTER LOGIC ---
  const filtered = requests.filter(r => {
      const matchesFilter = filter === "ALL" || r.status === filter;
      const searchLower = search.toLowerCase();
      const matchesSearch = 
        r.customer?.name?.toLowerCase().includes(searchLower) ||
        r.vehicle?.plate?.toLowerCase().includes(searchLower) ||
        r.service_title?.toLowerCase().includes(searchLower);
      return matchesFilter && matchesSearch;
  });

  async function handleLogout() {
      await fetch("/api/auth/signout", { method: "POST" });
      router.push("/login");
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans flex flex-col">
      
      {/* HEADER */}
      <div className="bg-white px-8 py-4 flex justify-between items-center border-b border-gray-200 sticky top-0 z-20 shadow-sm backdrop-blur-md bg-white/90">
          <div className="flex items-center gap-4">
            <div className="bg-black text-white px-3 py-1 rounded text-xl font-black tracking-tighter italic">
                REVLET
            </div>
            <div className="h-6 w-px bg-gray-200"></div>
            <div>
                <h1 className="font-bold text-gray-900 leading-none">Office</h1>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Intake & Review</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
             <div className="relative hidden md:block w-64">
                <IconSearch className="absolute left-3 top-2.5" />
                <input 
                    placeholder="Search VIN, Customer..." 
                    className="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-lg text-sm font-bold focus:ring-2 focus:ring-black outline-none transition"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
             </div>
             
             <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg transition">
                <IconLogout /> Logout
             </button>

             <button 
                onClick={() => router.push('/office/requests/new')}
                className="bg-black text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-lg hover:bg-gray-800 transition transform active:scale-95 flex items-center gap-2"
             >
                <IconPlus /> New Request
             </button>
          </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-7xl mx-auto w-full p-8">
          
          {/* KPI CARDS (Restored & Modernized) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
             <div onClick={() => setFilter("NEW")} className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm cursor-pointer hover:shadow-md hover:border-blue-200 transition group">
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2 flex justify-between">
                    New / Untouched <IconTrend className="text-blue-500 opacity-0 group-hover:opacity-100 transition" />
                </div>
                <div className="text-4xl font-black text-blue-600">{stats.new_requests}</div>
             </div>
             
             <div onClick={() => setFilter("WAITING_APPROVAL")} className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm cursor-pointer hover:shadow-md hover:border-amber-200 transition group">
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2 flex justify-between">
                    Needs Approval <IconTrend className="text-amber-500 opacity-0 group-hover:opacity-100 transition" />
                </div>
                <div className="text-4xl font-black text-amber-500">{stats.waiting_approval}</div>
             </div>

             <div onClick={() => setFilter("SCHEDULED")} className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm cursor-pointer hover:shadow-md hover:border-gray-300 transition group">
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2 flex justify-between">
                    Scheduled <IconTrend className="text-gray-900 opacity-0 group-hover:opacity-100 transition" />
                </div>
                <div className="text-4xl font-black text-gray-900">{stats.scheduled}</div>
             </div>

             <div onClick={() => setFilter("IN_PROGRESS")} className="p-5 bg-black rounded-2xl shadow-lg cursor-pointer hover:bg-gray-900 transition text-white">
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">In Progress</div>
                <div className="text-4xl font-black">{stats.in_progress}</div>
             </div>
          </div>

          {/* TABS */}
          <div className="flex gap-2 mb-6 border-b border-gray-200 pb-1">
              {["ALL", "NEW", "APPROVED", "COMPLETED"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={clsx(
                        "px-4 py-2 text-xs font-bold rounded-t-lg transition-all",
                        filter === status 
                            ? "text-black border-b-2 border-black bg-gray-50" 
                            : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                    )}
                  >
                      {status}
                  </button>
              ))}
          </div>

          {/* LIST */}
          <div className="space-y-4">
              {filtered.length === 0 && (
                  <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                      <p className="text-gray-400 font-bold">No requests found.</p>
                  </div>
              )}

              {filtered.map((r) => (
                  <div 
                    key={r.id}
                    onClick={() => router.push(`/office/requests/${r.id}`)}
                    className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition cursor-pointer group flex justify-between items-center"
                  >
                      <div className="flex items-center gap-6">
                          <div className={clsx(
                              "w-12 h-12 rounded-full flex items-center justify-center font-black text-lg",
                              r.status === 'NEW' ? "bg-amber-100 text-amber-600" :
                              r.status === 'APPROVED' ? "bg-blue-100 text-blue-600" :
                              r.status === 'COMPLETED' ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-600"
                          )}>
                              {r.customer?.name?.[0] || "?"}
                          </div>
                          <div>
                              <div className="flex items-center gap-3 mb-1">
                                  <h3 className="font-bold text-gray-900 text-lg">{r.customer?.name}</h3>
                                  <span className={clsx(
                                      "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide",
                                      r.status === 'NEW' ? "bg-amber-50 text-amber-600 border border-amber-100" :
                                      r.status === 'APPROVED' ? "bg-blue-50 text-blue-600 border border-blue-100" :
                                      r.status === 'COMPLETED' ? "bg-green-50 text-green-600 border border-green-100" : "bg-gray-50 text-gray-500 border border-gray-200"
                                  )}>
                                      {r.status.replace(/_/g, " ")}
                                  </span>
                                  {r.created_by_role === 'CUSTOMER' && (
                                      <span className="bg-purple-100 text-purple-700 text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wide">
                                          Portal Request
                                      </span>
                                  )}
                              </div>
                              <p className="text-sm text-gray-500 font-medium">
                                  {r.vehicle?.year} {r.vehicle?.make} {r.vehicle?.model} 
                                  <span className="mx-2 text-gray-300">|</span> 
                                  <span className="font-mono text-gray-400">{r.vehicle?.plate}</span>
                              </p>
                          </div>
                      </div>

                      <div className="text-right">
                          <div className="font-bold text-gray-900">{r.service_title}</div>
                          <div className="text-xs text-gray-400 font-mono mt-1">{new Date(r.created_at).toLocaleDateString()}</div>
                      </div>
                  </div>
              ))}
          </div>
      </div>
    </div>
  );
}