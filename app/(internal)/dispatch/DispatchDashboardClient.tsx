"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { REQUEST_STATUS, RequestStatusKey } from "@/lib/requestStatus";

// --- ICONS ---
const IconSearch = () => <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const IconCheck = () => <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>;
const IconClock = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const IconUsers = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-4-4h-1M9 20H4v-2a4 4 0 014-4h1m8-4a4 4 0 10-8 0 4 4 0 008 0z" /></svg>;
const IconEye = () => <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>;

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
  canAccessTech,
  technicians
}: {
  requests: any[];
  stats: any;
  isOffice: boolean;
  canAccessTech?: boolean;
  technicians: any[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | "ALL">("ALL");
  
  // Bulk Job Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkLead, setBulkLead] = useState("");
  const [bulkDate, setBulkDate] = useState("");
  const [bulkBypass, setBulkBypass] = useState(false);
  const [bulkKeyLocation, setBulkKeyLocation] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  
  // Roster & Notification State
  const [notifying, setNotifying] = useState(false);
  const [selectedTechs, setSelectedTechs] = useState<string[]>([]);
  
  // Tech Start Times
  const [techStarts, setTechStarts] = useState<{[key: string]: string}>(() => {
      const initial: any = {};
      technicians.forEach(t => {
          if(t.current_shift_start) initial[t.id] = t.current_shift_start;
      });
      return initial;
  });

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

  // --- JOB ACTIONS ---
  const toggleSelectAll = () => {
      if (selectedIds.length === filtered.length) setSelectedIds([]);
      else setSelectedIds(filtered.map(r => r.id));
  };

  const toggleRow = (id: string) => {
      if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(x => x !== id));
      else setSelectedIds([...selectedIds, id]);
  };

  // --- ROSTER ACTIONS ---
  const toggleTech = (id: string) => {
      if (selectedTechs.includes(id)) setSelectedTechs(selectedTechs.filter(x => x !== id));
      else setSelectedTechs([...selectedTechs, id]);
  };

  const handleBulkSchedule = async () => {
      if (!bulkLead || !bulkDate) return alert("Please select a Lead Tech and Date.");
      const actionType = bulkBypass ? "FORCE SCHEDULE" : "PROPOSE TIME";
      if(!confirm(`${actionType} for ${selectedIds.length} jobs?\nTech: ${bulkLead}\nDate: ${new Date(bulkDate).toLocaleString()}`)) return;

      setBulkLoading(true);
      const updates = selectedIds.map(id => 
          fetch(`/api/dispatch/propose`, { 
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                  ticket_id: id,
                  scheduled_start: new Date(bulkDate).toISOString(),
                  tech_id: bulkLead,
                  bypass_confirmation: bulkBypass,
                  key_location_override: bulkKeyLocation
              })
          })
      );

      try {
          await Promise.all(updates);
          router.refresh();
          setSelectedIds([]); 
          setBulkLead("");
          setBulkDate("");
          setBulkBypass(false);
          setBulkKeyLocation("");
      } catch (e) {
          alert("Error scheduling some jobs.");
      } finally {
          setBulkLoading(false);
      }
  };

  const handleSaveStartTime = async (techId: string, time: string) => {
      setTechStarts(prev => ({...prev, [techId]: time}));
      try {
          await fetch('/api/dispatch/roster', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ tech_id: techId, start_time: time })
          });
      } catch (e) { console.error("Failed to save time", e); }
  };

  const handleNotifyTeam = async () => {
      const targetCount = selectedTechs.length > 0 ? selectedTechs.length : "ALL";
      if (!confirm(`Send SMS notifications to ${targetCount} technicians?`)) return;

      setNotifying(true);
      try {
          const res = await fetch("/api/dispatch/notify", { 
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ recipients: selectedTechs }) 
          });
          
          const contentType = res.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
              throw new Error("Server returned non-JSON response.");
          }

          const data = await res.json();
          if (res.ok) {
              alert(`✅ Roster sent! ${data.results.length} technicians notified.`);
              setSelectedTechs([]);
          } else {
              alert("Server Error: " + (data.error || data.message));
          }
      } catch (e: any) {
          alert("Connection Failed: " + e.message);
      } finally {
          setNotifying(false);
      }
  };

  const StatusPill = ({ code }: { code: string }) => {
    const key = (code as RequestStatusKey) || "NEW";
    const meta = REQUEST_STATUS[key] || { label: code, tone: "zinc" };
    return (
      <span className={clsx("inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide", toneChip(meta.tone || "zinc"))}>
        {meta.label}
      </span>
    );
  };

  const StatCard = ({ label, value, onClick, tone }: any) => (
    <button onClick={onClick} className={clsx("bg-white p-5 rounded-xl border shadow-sm text-left transition relative overflow-hidden", tone === "blue" && "border-blue-200 hover:border-blue-300", tone === "amber" && "border-amber-200 hover:border-amber-300", tone === "red" && "border-red-200 hover:border-red-300", tone === "zinc" && "border-zinc-200 hover:border-zinc-300")}> 
      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">{label}</p>
      <div className="text-3xl font-black text-zinc-900 tabular-nums">{value}</div>
    </button>
  );

  return (
    <div className="min-h-screen bg-[#F4F5F7] flex flex-col text-zinc-900 pb-40"> 
      
      {/* HEADER */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-30 px-8 h-16 flex justify-between items-center shadow-sm/50">
          <div className="flex items-center gap-6">
            <h1 className="text-lg font-black text-zinc-900 tracking-tight">Dispatch Console</h1>
          </div>
          <div className="flex items-center gap-4">
              {/* REMOVED TECH APP BUTTON FOR CLARITY */}
              
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

      <main className="flex-1 w-full max-w-[1920px] mx-auto grid grid-cols-12 gap-8 px-8 py-8">
        
        {/* LEFT COLUMN: Main Board (Span 9) */}
        <div className="col-span-9 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard label="Unassigned" value={stats.unassigned} tone="amber" onClick={() => setStatusFilter("READY_TO_SCHEDULE")} />
              <StatCard label="Scheduled" value={stats.scheduled} tone="zinc" onClick={() => setStatusFilter("SCHEDULED")} />
              <StatCard label="In Progress" value={stats.inProgress} tone="blue" onClick={() => setStatusFilter("IN_PROGRESS")} />
              <StatCard label="Attention" value={stats.atRisk} tone="red" onClick={() => setStatusFilter("ATTENTION_REQUIRED")} />
            </div>

            <div className="flex justify-end gap-2">
                {["ALL", "READY_TO_SCHEDULE", "WAITING_CONFIRMATION", "SCHEDULED", "IN_PROGRESS", "COMPLETED"].map((code) => (
                  <button key={code} onClick={() => setStatusFilter(code)} className={clsx("px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide border transition", statusFilter === code ? "bg-black text-white border-black" : "bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300 hover:text-zinc-900")}>
                    {code.replace(/_/g, " ")}
                  </button>
                ))}
            </div>

            <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden min-h-[500px]">
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
        </div>

        {/* RIGHT COLUMN: Tech Roster (Span 3) */}
        <div className="col-span-3 space-y-6">
            <div className="bg-white border border-zinc-200 rounded-xl shadow-sm p-5 sticky top-24">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                        <IconUsers /> Team Roster
                    </h3>
                    <div className="flex items-center gap-2">
                        {/* REMOVED + MANAGE LINK */}
                        <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Live</span>
                    </div>
                </div>

                <div className="space-y-4">
                    {technicians.map((t) => {
                        const isSelected = selectedTechs.includes(t.id);
                        return (
                            <div key={t.id} className={clsx("group rounded-lg p-2 transition border", isSelected ? "bg-blue-50 border-blue-200" : "hover:bg-zinc-50 border-transparent")}>
                                <div className="flex items-center gap-3 mb-2">
                                    {/* SELECT CHECKBOX */}
                                    <button 
                                        onClick={() => toggleTech(t.id)}
                                        className={clsx("w-5 h-5 rounded border flex items-center justify-center transition shrink-0", isSelected ? "bg-blue-600 border-blue-600" : "bg-white border-zinc-300")}
                                    >
                                        {isSelected && <IconCheck />}
                                    </button>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-sm text-zinc-900 truncate">{t.full_name}</span>
                                            
                                            {/* ✅ OBVIOUS VIEW BUTTON (ALWAYS VISIBLE) */}
                                            {isOffice && (
                                                <Link 
                                                    href={`/dispatch/tech-view?id=${t.id}`}
                                                    className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 transition"
                                                    title="View Dashboard"
                                                >
                                                    <span className="text-indigo-600"><IconEye /></span>
                                                    <span className="text-[9px] font-bold text-indigo-700 uppercase tracking-wide">View</span>
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-2 pl-8">
                                    <div className="text-zinc-400 text-xs"><IconClock /></div>
                                    <input 
                                        type="time" 
                                        className="flex-1 bg-white border border-zinc-200 rounded-lg px-2 py-1.5 text-xs font-bold text-zinc-900 outline-none focus:ring-2 focus:ring-black transition"
                                        value={techStarts[t.id] || "08:00"}
                                        onChange={(e) => setTechStarts({...techStarts, [t.id]: e.target.value})}
                                        onBlur={(e) => handleSaveStartTime(t.id, e.target.value)}
                                    />
                                </div>
                            </div>
                        );
                    })}
                    {technicians.length === 0 && <div className="text-xs text-zinc-400 italic">No technicians active.</div>}
                </div>

                <div className="mt-6 pt-6 border-t border-zinc-100">
                    <button 
                        onClick={handleNotifyTeam}
                        disabled={notifying}
                        className={clsx("w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wide transition shadow-lg",
                            selectedTechs.length > 0 
                                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20" 
                                : "bg-black hover:bg-zinc-800 text-white"
                        )}
                    >
                        {notifying ? "Sending..." : selectedTechs.length > 0 ? `Notify Selected (${selectedTechs.length})` : "Notify All Active"}
                    </button>
                </div>
            </div>
        </div>

      </main>

      {/* FLOATY BULK ACTION BAR */}
      {selectedIds.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white border border-zinc-200 shadow-2xl rounded-2xl p-4 flex flex-col items-center gap-3 z-50 animate-in slide-in-from-bottom-10 fade-in duration-300 min-w-[600px]">
              <div className="flex items-center gap-4 w-full">
                  <div className="bg-black text-white px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wide whitespace-nowrap">
                      {selectedIds.length} Selected
                  </div>

                  <select 
                      value={bulkLead} 
                      onChange={(e) => setBulkLead(e.target.value)}
                      className="bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm font-bold text-zinc-900 focus:ring-2 focus:ring-black outline-none flex-1"
                  >
                      <option value="">Select Tech...</option>
                      {technicians.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                  </select>

                  <input 
                      type="datetime-local" 
                      value={bulkDate} 
                      onChange={(e) => setBulkDate(e.target.value)}
                      className="bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm font-bold text-zinc-900 focus:ring-2 focus:ring-black outline-none flex-1"
                  />
                  
                  <button onClick={() => setSelectedIds([])} className="text-zinc-400 hover:text-black transition p-2">✕</button>
              </div>

              <div className="flex items-center gap-4 w-full bg-zinc-50 p-2 rounded-xl border border-zinc-100">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={bulkBypass} 
                        onChange={e => setBulkBypass(e.target.checked)}
                        className="w-4 h-4 rounded text-black focus:ring-black"
                      />
                      <span className="text-xs font-bold text-zinc-700 uppercase">Force Schedule</span>
                  </label>

                  {bulkBypass && (
                      <input 
                        value={bulkKeyLocation} 
                        onChange={e => setBulkKeyLocation(e.target.value)}
                        placeholder="Key Location (Required for Bypass)"
                        className="flex-1 bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-xs font-medium focus:ring-2 focus:ring-black outline-none animate-in fade-in slide-in-from-left-2"
                      />
                  )}

                  <button 
                      onClick={handleBulkSchedule}
                      disabled={bulkLoading || (bulkBypass && !bulkKeyLocation)}
                      className={clsx(
                          "px-6 py-2 rounded-lg font-bold text-sm transition shadow-lg active:scale-95 ml-auto whitespace-nowrap",
                          bulkBypass 
                              ? "bg-red-600 hover:bg-red-700 text-white shadow-red-600/20" 
                              : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20"
                      )}
                  >
                      {bulkLoading ? "Saving..." : bulkBypass ? "Force Schedule" : "Propose Time"}
                  </button>
              </div>
          </div>
      )}

    </div>
  );
}