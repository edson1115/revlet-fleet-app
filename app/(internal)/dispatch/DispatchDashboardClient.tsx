"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { REQUEST_STATUS, RequestStatusKey } from "@/lib/requestStatus";

const IconSearch = () => <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const IconCheck = () => <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>;

const toneChip = (tone: string) =>
  tone === "emerald" ? "bg-emerald-100 text-emerald-700" :
  tone === "blue" ? "bg-blue-100 text-blue-700" :
  tone === "amber" ? "bg-amber-100 text-amber-700" :
  tone === "red" ? "bg-red-100 text-red-700" :
  "bg-zinc-100 text-zinc-700";

export default function DispatchDashboardClient({
  requests,
  stats,
  isOffice,
  technicians // <--- ✅ Receive Tech List
}: {
  requests: any[];
  stats: any;
  isOffice: boolean;
  technicians: any[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | "ALL">("ALL");
  
  // ✅ Bulk Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkLead, setBulkLead] = useState("");
  const [bulkBuddy, setBulkBuddy] = useState("");
  const [bulkDate, setBulkDate] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return requests.filter((r) => {
      const matchesStatus = statusFilter === "ALL" ? true : r.status === statusFilter;
      const vehicleText = `${r.vehicle?.year || ""} ${r.vehicle?.make || ""} ${r.vehicle?.model || ""}`.toLowerCase();
      const plate = (r.vehicle?.plate || "").toLowerCase();
      const customer = (r.customer?.name || "").toLowerCase();
      
      const matchesSearch = !q || vehicleText.includes(q) || plate.includes(q) || customer.includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [requests, search, statusFilter]);

  // --- BULK ACTIONS ---
  const toggleSelectAll = () => {
      if (selectedIds.length === filtered.length) {
          setSelectedIds([]);
      } else {
          setSelectedIds(filtered.map(r => r.id));
      }
  };

  const toggleRow = (id: string) => {
      if (selectedIds.includes(id)) {
          setSelectedIds(selectedIds.filter(x => x !== id));
      } else {
          setSelectedIds([...selectedIds, id]);
      }
  };

  const handleBulkSchedule = async () => {
      if (!bulkLead || !bulkDate) {
          alert("Please select a Lead Tech and Date to schedule these jobs.");
          return;
      }
      
      if(!confirm(`Schedule ${selectedIds.length} jobs for ${bulkLead} on ${new Date(bulkDate).toLocaleString()}?`)) return;

      setBulkLoading(true);

      // Create array of promises to update all selected rows
      const updates = selectedIds.map(id => 
          fetch(`/api/dispatch/requests/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                  status: "SCHEDULED",
                  technician_id: bulkLead,
                  second_technician_id: bulkBuddy || null,
                  scheduled_at: new Date(bulkDate).toISOString()
              })
          })
      );

      try {
          await Promise.all(updates);
          router.refresh();
          setSelectedIds([]); // Clear selection
          setBulkLead("");
          setBulkDate("");
      } catch (e) {
          alert("Error scheduling some jobs.");
      } finally {
          setBulkLoading(false);
      }
  };

  const StatusPill = ({ code }: { code: string }) => {
    const key = (code as RequestStatusKey) || "NEW";
    const meta = REQUEST_STATUS[key] || { label: code, tone: "zinc" };
    return (
      <span className={clsx("inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide", toneChip(meta.tone))}>
        {meta.label}
      </span>
    );
  };

  // ... (StatCard Component remains same) ...
  const StatCard = ({ label, value, onClick, tone }: any) => (
    <button onClick={onClick} className={clsx("bg-white p-5 rounded-xl border shadow-sm text-left transition relative overflow-hidden", tone === "blue" && "border-blue-200 hover:border-blue-300", tone === "amber" && "border-amber-200 hover:border-amber-300", tone === "red" && "border-red-200 hover:border-red-300", tone === "zinc" && "border-zinc-200 hover:border-zinc-300")}> 
      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">{label}</p>
      <div className="text-3xl font-black text-zinc-900 tabular-nums">{value}</div>
    </button>
  );

  return (
    <div className="min-h-screen bg-[#F4F5F7] flex flex-col text-zinc-900 pb-32"> {/* Added pb-32 for floating bar space */}
      
      {/* HEADER */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-30 px-8 h-16 flex justify-between items-center shadow-sm/50">
          <div className="flex items-center gap-6">
            <h1 className="text-lg font-black text-zinc-900 tracking-tight">Dispatch Console</h1>
          </div>
          <div className="flex items-center gap-4">
             {isOffice && (
                <Link href="/office" className="bg-zinc-800 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-zinc-700 transition flex items-center gap-2 shadow-lg shadow-zinc-800/20">
                    <span>← Return to HQ</span>
                </Link>
             )}
             <div className="relative">
                 <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search Queue..." className="pl-9 pr-4 py-1.5 bg-zinc-100 border-none rounded-lg text-sm font-bold w-[300px] focus:bg-white focus:ring-2 focus:ring-black transition outline-none" />
                 <div className="absolute left-3 top-2 text-zinc-400"><IconSearch /></div>
             </div>
          </div>
      </header>

      <main className="flex-1 max-w-[1600px] mx-auto w-full px-8 py-8 space-y-8">
        
        {/* KPI STRIP */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard label="Unassigned" value={stats.unassigned} tone="amber" onClick={() => setStatusFilter("READY_TO_SCHEDULE")} />
          <StatCard label="Scheduled" value={stats.scheduled} tone="zinc" onClick={() => setStatusFilter("SCHEDULED")} />
          <StatCard label="In Progress" value={stats.inProgress} tone="blue" onClick={() => setStatusFilter("IN_PROGRESS")} />
          <StatCard label="Attention" value={stats.atRisk} tone="red" onClick={() => setStatusFilter("ATTENTION_REQUIRED")} />
        </div>

        {/* FILTERS */}
        <div className="flex justify-end gap-2">
            {["ALL", "READY_TO_SCHEDULE", "SCHEDULED", "IN_PROGRESS", "COMPLETED"].map((code) => (
              <button key={code} onClick={() => setStatusFilter(code)} className={clsx("px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide border transition", statusFilter === code ? "bg-black text-white border-black" : "bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300 hover:text-zinc-900")}>
                {code.replace(/_/g, " ")}
              </button>
            ))}
        </div>

        {/* TABLE */}
        <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 text-zinc-400 font-bold uppercase text-[10px] tracking-widest border-b border-zinc-100">
                <tr>
                  <th className="px-6 py-4 w-10">
                      <button onClick={toggleSelectAll} className={clsx("w-5 h-5 rounded border flex items-center justify-center transition", selectedIds.length === filtered.length && filtered.length > 0 ? "bg-black border-black" : "bg-white border-zinc-300")}>
                          {selectedIds.length === filtered.length && filtered.length > 0 && <IconCheck />}
                      </button>
                  </th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Vehicle / Order</th>
                  <th className="px-6 py-4">Service</th>
                  <th className="px-6 py-4">Tech</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-zinc-50">
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-12 text-center text-zinc-400 font-medium">No requests found.</td></tr>
                ) : (
                  filtered.map((r) => {
                    const isSelected = selectedIds.includes(r.id);
                    const vehicleTitle = r.vehicle ? `${r.vehicle.year} ${r.vehicle.make} ${r.vehicle.model}` : "Fleet Order";
                    
                    return (
                      <tr key={r.id} className={clsx("transition hover:bg-zinc-50", isSelected && "bg-blue-50/50 hover:bg-blue-50")}>
                        <td className="px-6 py-4">
                            <button onClick={() => toggleRow(r.id)} className={clsx("w-5 h-5 rounded border flex items-center justify-center transition", isSelected ? "bg-black border-black" : "bg-white border-zinc-300")}>
                                {isSelected && <IconCheck />}
                            </button>
                        </td>
                        <td onClick={() => router.push(`/dispatch/requests/${r.id}`)} className="px-6 py-4 cursor-pointer"><StatusPill code={r.status} /></td>
                        <td onClick={() => router.push(`/dispatch/requests/${r.id}`)} className="px-6 py-4 font-bold text-zinc-800 cursor-pointer">{r.customer?.name}</td>
                        <td onClick={() => router.push(`/dispatch/requests/${r.id}`)} className="px-6 py-4 cursor-pointer"><div className="font-bold text-zinc-900">{vehicleTitle}</div><div className="text-xs text-zinc-500 mt-0.5">{r.vehicle?.plate || "N/A"}</div></td>
                        <td onClick={() => router.push(`/dispatch/requests/${r.id}`)} className="px-6 py-4 cursor-pointer"><div className="font-medium text-zinc-900">{r.service_title}</div><div className="text-xs text-zinc-400 truncate max-w-[200px]">{r.service_description || r.description || "No notes"}</div></td>
                        <td onClick={() => router.push(`/dispatch/requests/${r.id}`)} className="px-6 py-4 cursor-pointer">{r.technician ? <span className="inline-flex items-center gap-1 bg-zinc-100 px-2 py-1 rounded text-xs font-bold text-zinc-700">{r.technician.full_name}{r.second_technician && <span className="text-zinc-400">+1</span>}</span> : <span className="text-zinc-400 text-xs italic">Unassigned</span>}</td>
                        <td className="px-6 py-4 text-right"><span className="text-blue-600 font-bold text-xs uppercase opacity-0 group-hover:opacity-100 transition">Manage &rarr;</span></td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* ✅ FLOATY BULK ACTION BAR */}
      {selectedIds.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white border border-zinc-200 shadow-2xl rounded-2xl p-4 flex items-center gap-4 z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
              <div className="bg-black text-white px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wide">
                  {selectedIds.length} Selected
              </div>

              <div className="h-8 w-px bg-zinc-200" />

              <div className="flex items-center gap-2">
                  <select 
                      value={bulkLead} 
                      onChange={(e) => setBulkLead(e.target.value)}
                      className="bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm font-bold text-zinc-900 focus:ring-2 focus:ring-black outline-none"
                  >
                      <option value="">Select Lead Tech...</option>
                      {technicians.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                  </select>

                  <select 
                      value={bulkBuddy} 
                      onChange={(e) => setBulkBuddy(e.target.value)}
                      className="bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm font-bold text-zinc-700 focus:ring-2 focus:ring-black outline-none"
                  >
                      <option value="">No Buddy</option>
                      {technicians.map(t => t.id !== bulkLead && <option key={t.id} value={t.id}>{t.full_name}</option>)}
                  </select>

                  <input 
                      type="datetime-local" 
                      value={bulkDate}
                      onChange={(e) => setBulkDate(e.target.value)}
                      className="bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm font-bold text-zinc-900 focus:ring-2 focus:ring-black outline-none"
                  />
              </div>

              <button 
                  onClick={handleBulkSchedule}
                  disabled={bulkLoading}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 transition shadow-lg shadow-blue-600/20 active:scale-95"
              >
                  {bulkLoading ? "Scheduling..." : "Schedule All"}
              </button>

              <button onClick={() => setSelectedIds([])} className="text-zinc-400 hover:text-black transition p-2">
                  ✕
              </button>
          </div>
      )}

    </div>
  );
}