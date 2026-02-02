"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { REQUEST_STATUS, RequestStatusKey } from "@/lib/requestStatus";
import { useProductTour } from "@/hooks/useProductTour";

// --- ICONS ---
const IconSearch = () => <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const IconCar = () => <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>;
const IconBox = () => <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>;
const IconMap = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>;
const IconGear = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const IconLogout = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
const IconTrendingUp = () => <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;
const IconHelp = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const IconTrophy = () => <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>;
const IconBell = () => <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;

export default function OfficeDashboardClient({
  requests,
  stats,
  feedSlot, 
}: {
  requests: any[];
  stats: any;
  feedSlot?: React.ReactNode;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | "ALL">("ALL");

  const { startTour } = useProductTour("office_v1", [
    { element: '#tour-brand', popover: { title: 'HQ Dashboard', description: 'This is your mission control.' } },
    { element: '#tour-list', popover: { title: 'Active Queue', description: 'View and manage all service requests in this list.' } },
  ]);

  // --- FILTER LOGIC ---
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return requests.filter((r) => {
      const matchesStatus = statusFilter === "ALL" ? true : r.status === statusFilter;

      const vehicleText = `${r.vehicle?.year || ""} ${r.vehicle?.make || ""} ${r.vehicle?.model || ""}`.toLowerCase();
      const plate = (r.vehicle?.plate || "").toLowerCase();
      const customer = (r.customer?.name || "").toLowerCase();
      const service = (r.service_title || "").toLowerCase();
      const description = (r.description || "").toLowerCase(); 
      const serviceDesc = (r.service_description || "").toLowerCase();

      const matchesSearch = !q || 
        vehicleText.includes(q) || 
        plate.includes(q) || 
        customer.includes(q) || 
        service.includes(q) ||
        description.includes(q) ||
        serviceDesc.includes(q);

      return matchesStatus && matchesSearch;
    });
  }, [requests, search, statusFilter]);

  async function handleLogout() {
      await fetch("/api/auth/signout", { method: "POST" });
      router.push("/login");
  }

  const StatCard = ({ label, value, onClick, active, color }: any) => (
    <button
      onClick={onClick}
      className={clsx(
        "p-4 rounded-xl border text-left transition group relative overflow-hidden flex flex-col justify-between h-full min-w-0",
        active 
            ? `bg-white border-${color}-500 ring-2 ring-${color}-500/20 shadow-md` 
            : "bg-white border-zinc-200 hover:border-zinc-300 hover:shadow-sm"
      )}
    >
      <div className="flex justify-between items-start w-full">
         <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{label}</p>
         <div className={clsx("w-2 h-2 rounded-full", active ? `bg-${color}-500` : `bg-${color}-200 group-hover:bg-${color}-400`)} />
      </div>
      <div className="text-3xl font-black text-zinc-900 tabular-nums">{value}</div>
    </button>
  );

  return (
    <div className="h-screen bg-[#F4F5F7] flex flex-col font-sans text-zinc-900 overflow-hidden">
      
      {/* 🎨 STYLES */}
      <style dangerouslySetInnerHTML={{ __html: `
        svg.driver-overlay { backdrop-filter: none !important; }
        .driver-overlay path { fill: rgba(0, 0, 0, 0.75) !important; }
        .driver-active-element { background-color: #fff !important; z-index: 100004 !important; }
      `}} />

      {/* --- HEADER --- */}
      <header className="bg-white border-b border-zinc-200 h-14 px-6 flex justify-between items-center shadow-sm shrink-0">
          <div className="flex items-center gap-6" id="tour-brand"> 
            
            {/* ✅ FIXED: Now redirects to /office to keep user in Dashboard */}
            <div 
                className="text-xl font-black italic tracking-tighter flex items-center gap-2 select-none cursor-pointer" 
                onClick={() => router.push('/office')}
            >
              <span className="bg-black text-white px-2 py-0.5 rounded text-sm">R</span> REVLET
            </div>

            <div className="h-5 w-px bg-zinc-200 hidden md:block" />
            <span className="hidden md:block text-xs font-bold text-zinc-900">Office Console</span>
          </div>

          <div className="hidden lg:flex items-center bg-zinc-100/80 p-1 rounded-lg border border-zinc-200" id="tour-nav">
             <button onClick={() => router.push('/dispatch')} className="px-3 py-1.5 rounded-md text-xs font-bold text-zinc-500 hover:text-black hover:bg-white hover:shadow-sm transition flex items-center gap-2"><IconMap /> Dispatch</button>
             <button onClick={() => router.push('/office/leaderboard')} className="px-3 py-1.5 rounded-md text-xs font-bold text-zinc-500 hover:text-black hover:bg-white hover:shadow-sm transition flex items-center gap-2"><IconTrophy /> Rankings</button>
             <button onClick={() => router.push('/office/inventory')} className="px-3 py-1.5 rounded-md text-xs font-bold text-zinc-500 hover:text-black hover:bg-white hover:shadow-sm transition flex items-center gap-2"><IconBox /> Inventory</button>
          </div>

          <div className="flex items-center gap-2">
             <div className="relative group hidden xl:block" id="tour-search"> 
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="pl-8 pr-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-bold focus:bg-white focus:ring-2 focus:ring-black/5 focus:border-black outline-none w-48 transition" />
                <div className="absolute left-2.5 top-2"><IconSearch /></div>
             </div>
             <button onClick={() => router.push('/office/settings')} className="p-2 text-zinc-400 hover:text-black rounded-lg"><IconGear /></button>
             <button onClick={handleLogout} className="p-2 text-zinc-400 hover:text-red-600 rounded-lg"><IconLogout /></button>
          </div>
      </header>

      {/* --- ACTION BAR --- */}
      <div className="bg-zinc-50/80 backdrop-blur-md border-b border-zinc-200 px-6 py-3 flex justify-between items-center shrink-0">
          <div>
              <h1 className="text-xl font-black text-zinc-900 tracking-tight">Intake & Dispatch</h1>
              <p className="text-[10px] font-medium text-zinc-500">Live Operations List</p>
          </div>
          <button id="tour-new-req" onClick={() => router.push('/office/requests/new')} className="bg-black text-white px-4 py-2 rounded-lg text-xs font-bold shadow-lg shadow-black/10 hover:bg-zinc-800 transition flex items-center gap-2"><span>+</span> New Request</button>
      </div>

      {/* --- MAIN CONTENT (FULL WIDTH) --- */}
      <main className="flex-1 w-full max-w-[1920px] mx-auto p-4 overflow-hidden">
        <div className="flex flex-col gap-4 h-full">
            
            {/* KPI STRIP + FEED EMBEDDED (5 COLUMNS) */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 shrink-0 h-28" id="tour-kpi">
                <StatCard label="Unassigned" value={stats.unassigned} color="amber" active={statusFilter === "NEW"} onClick={() => setStatusFilter(statusFilter === "NEW" ? "ALL" : "NEW")} />
                <StatCard label="Scheduled" value={stats.scheduled} color="purple" active={statusFilter === "SCHEDULED"} onClick={() => setStatusFilter(statusFilter === "SCHEDULED" ? "ALL" : "SCHEDULED")} />
                <StatCard label="In Progress" value={stats.inProgress} color="blue" active={statusFilter === "IN_PROGRESS"} onClick={() => setStatusFilter(statusFilter === "IN_PROGRESS" ? "ALL" : "IN_PROGRESS")} />
                <StatCard label="Attention" value={stats.attention} color="red" active={statusFilter === "ATTENTION_REQUIRED"} onClick={() => setStatusFilter(statusFilter === "ATTENTION_REQUIRED" ? "ALL" : "ATTENTION_REQUIRED")} />
                
                {/* 5th Column: LIVE FEED (Compacted) */}
                {/* ✅ FIXED: Removed the outer header, kept the slot container */}
                <div className="h-full min-h-0">
                     {feedSlot}
                </div>
            </div>

            {/* TABLE LIST (FULL WIDTH - Fills remaining height) */}
            <div className="bg-white border border-zinc-200 rounded-xl shadow-sm flex flex-col flex-1 min-h-0 overflow-hidden" id="tour-list">
                
                {/* Table Filters Header */}
                <div className="px-4 py-3 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50 shrink-0">
                    <h2 className="text-sm font-black text-zinc-900 tracking-tight">Active Queue <span className="text-zinc-400 font-medium ml-2 text-xs">{filtered.length}</span></h2>
                    <div className="flex bg-white border border-zinc-200 rounded-lg p-1 shadow-sm">
                        {["ALL", "NEW", "APPROVED", "COMPLETED"].map((code) => (
                            <button
                                key={code}
                                onClick={() => setStatusFilter(code)}
                                className={clsx(
                                    "px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wide transition-all",
                                    statusFilter === code ? "bg-zinc-900 text-white shadow-sm" : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
                                )}
                            >
                                {code}
                            </button>
                        ))}
                    </div>
                </div>

                {/* SCROLLABLE TABLE AREA */}
                <div className="overflow-auto flex-1">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-zinc-50 text-zinc-400 font-bold uppercase text-[10px] tracking-widest border-b border-zinc-200 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="px-6 py-3">Asset / Order</th>
                                <th className="px-6 py-3">Customer</th>
                                <th className="px-6 py-3">Service</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3 text-right">Age</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <p className="font-bold text-zinc-900">No requests found</p>
                                        <p className="text-xs text-zinc-400 mt-1">Try adjusting your filters.</p>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((r) => {
                                    const isTireOrder = r.service_title === "Tire Purchase";
                                    const hasVehicle = !!r.vehicle;
                                    const poMatch = r.description?.match(/PO #:\s*(.+)/) || r.service_description?.match(/PO #:\s*(.+)/);
                                    const poValue = poMatch ? poMatch[1].trim() : "N/A";
                                    const displayTitle = hasVehicle ? `${r.vehicle.year} ${r.vehicle.make} ${r.vehicle.model}` : (isTireOrder ? "Fleet Order" : "No Vehicle");
                                    const displaySubtitle = hasVehicle ? r.vehicle.plate : (isTireOrder ? `PO: ${poValue}` : "N/A");
                                    const statusKey = (r.status as RequestStatusKey) || "NEW";
                                    const statusConfig = REQUEST_STATUS[statusKey] || REQUEST_STATUS.NEW;
                                    const daysOld = Math.floor((Date.now() - new Date(r.created_at).getTime()) / (1000 * 60 * 60 * 24));
                                    let displayNote = r.service_description || r.description || "No details";
                                    if (r.status === 'RESCHEDULE_PENDING' && r.technician_notes) { displayNote = r.technician_notes; }
                                    const notes = r.technician_notes || "";
                                    const redCount = (notes.match(/🔴/g) || []).length;
                                    const yellowCount = (notes.match(/🟡/g) || []).length;
                                    const upsellCount = redCount + yellowCount;
                                    const isUpsellOpp = upsellCount > 0 && (r.status === 'COMPLETED' || r.status === 'BILLED');

                                    return (
                                        <tr key={r.id} onClick={() => router.push(`/office/requests/${r.id}`)} className="hover:bg-zinc-50/80 transition cursor-pointer group">
                                            <td className="px-6 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center shrink-0">
                                                        {isTireOrder ? <IconBox /> : <IconCar />}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-zinc-900 text-xs">{displayTitle}</div>
                                                        <div className={clsx("text-[9px] font-mono mt-0.5 inline-block px-1 rounded", isTireOrder ? "bg-blue-50 text-blue-600 font-bold" : "bg-zinc-100 text-zinc-500")}>
                                                            {displaySubtitle}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="font-bold text-zinc-700 text-xs">{r.customer?.name || "Unknown"}</div>
                                                {r.created_by_role === 'CUSTOMER' && <span className="text-[8px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100">PORTAL</span>}
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="font-medium text-zinc-900 text-xs">{r.service_title || "—"}</div>
                                                <div className={clsx("text-[10px] truncate max-w-[200px]", r.status === 'RESCHEDULE_PENDING' ? "text-red-600 font-bold" : "text-zinc-400")} title={displayNote}>{displayNote}</div>
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="flex flex-col items-start gap-1">
                                                    <span className={clsx("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide", statusConfig.bg, statusConfig.text)}>
                                                        <div className={clsx("w-1.5 h-1.5 rounded-full", statusConfig.dot, statusConfig.pulse && "animate-pulse")} />
                                                        {statusConfig.label}
                                                    </span>
                                                    {isUpsellOpp && <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wide animate-pulse"><IconTrendingUp /> {upsellCount} Opportunity</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 text-right text-[10px] font-mono text-zinc-400">{daysOld === 0 ? "Today" : `${daysOld}d ago`}</td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
      </main>
    </div>
  );
}