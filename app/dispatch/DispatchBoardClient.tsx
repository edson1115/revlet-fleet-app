"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import clsx from "clsx";

// --- ICONS ---
const IconCalendar = () => <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const IconClock = () => <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const IconParts = () => <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>;
const IconUser = () => <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const IconLogout = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
// New Bell Icon
const IconBell = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;

// --- HELPERS ---
function fmtDate(v: any) {
  if (!v) return "—";
  try {
    const d = new Date(v);
    return d.toLocaleString();
  } catch {
    return "—";
  }
}

function Row({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="text-gray-500 font-bold">{label}</div>
      <div className="text-gray-900 font-black">{value}</div>
    </div>
  );
}

// --- CONFIG ---
const COLUMNS = [
  { id: "READY_TO_SCHEDULE", label: "Ready to Schedule", color: "bg-gray-50 border-gray-200", badge: "bg-gray-200 text-gray-700" },
  { id: "SCHEDULED", label: "Scheduled", color: "bg-blue-50/50 border-blue-100", badge: "bg-blue-100 text-blue-700" },
  { id: "IN_PROGRESS", label: "In Progress", color: "bg-green-50/50 border-green-100", badge: "bg-green-100 text-green-700" }
];

// Lifecycle Badge Helper
function getLifecycleBadge(r: any) {
  if (r.completed_at) {
    return { label: "Completed", cls: "bg-green-100 text-green-800" };
  }

  if (r.waiting_for_parts_at || r.waiting_for_approval_at) {
    return { label: "Waiting", cls: "bg-amber-100 text-amber-800" };
  }

  if (r.started_at) {
    return { label: "In Progress", cls: "bg-blue-100 text-blue-800" };
  }

  if (r.scheduled_start_at) {
    return { label: "Scheduled", cls: "bg-blue-50 text-blue-700" };
  }

  return { label: "New", cls: "bg-gray-100 text-gray-500" };
}

export default function DispatchBoardClient({ initialRequests, technicians }: { initialRequests: any[], technicians: any[] }) {
  // ✅ LOCKED FIELDS CONSTANT
  const DISPATCH_LOCKED_FIELDS = true;

  const router = useRouter();
  const [requests, setRequests] = useState<any[]>(initialRequests);
  const [selectedReq, setSelectedReq] = useState<any | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleData, setScheduleData] = useState({ date: "", time: "", techId: "", buddyId: "" });

  // --- LIFECYCLE STATE ---
  const [showLifecycleModal, setShowLifecycleModal] = useState(false);
  const [lifecycleLoading, setLifecycleLoading] = useState(false);
  const [lifecycleError, setLifecycleError] = useState<string | null>(null);
  const [lifecycle, setLifecycle] = useState<any | null>(null);

  // --- ALERTS STATE & LOGIC ---
  const [alerts, setAlerts] = useState<any[]>([]);
  const [showAlerts, setShowAlerts] = useState(false);

  async function loadAlerts() {
    try {
      const r = await fetch("/api/dispatch/alerts", { cache: "no-store" });
      const j = await r.json();
      if (j.ok) setAlerts(j.alerts);
    } catch (e) {
      console.error("Silent alert fetch fail", e);
    }
  }

  useEffect(() => {
    loadAlerts();
    const i = setInterval(loadAlerts, 30000); // Poll every 30s
    return () => clearInterval(i);
  }, []);

  // --- BRANDING LOGIC ---
  function getCustomerStyle(name: string = "") {
      const n = name.toLowerCase();
      if (n.includes("enterprise")) return { bg: "bg-green-100", text: "text-green-800", border: "border-green-200", tag: "Enterprise" };
      if (n.includes("hertz")) return { bg: "bg-yellow-100", text: "text-yellow-800", border: "border-yellow-200", tag: "Hertz" };
      if (n.includes("holman")) return { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-200", tag: "Holman" };
      if (n.includes("carsnow")) return { bg: "bg-indigo-100", text: "text-indigo-800", border: "border-indigo-200", tag: "CarsNow" };
      return { bg: "bg-gray-100", text: "text-gray-600", border: "border-gray-200", tag: name };
  }

  // --- ACTIONS ---
  async function handleLogout() {
      await fetch("/api/auth/signout", { method: "POST" });
      router.push("/login");
  }

  async function onDragEnd(result: any) {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    const newStatus = destination.droppableId;
    
    setRequests(prev => prev.map(r => r.id === draggableId ? { ...r, status: newStatus } : r));

    await fetch(`/api/dispatch/update-status`, {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify({ id: draggableId, status: newStatus })
    });
  }

  async function openLifecycle(req: any) {
    try {
      setLifecycle(null);
      setLifecycleError(null);
      setLifecycleLoading(true);
      setShowLifecycleModal(true);
  
      const res = await fetch(`/api/dispatch/requests/${req.id}/lifecycle`, {
        cache: "no-store",
      });
  
      const json = await res.json();
  
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Failed to load lifecycle");
      }
  
      setLifecycle(json.lifecycle);
    } catch (e: any) {
      setLifecycleError(e?.message || "Failed to load lifecycle");
    } finally {
      setLifecycleLoading(false);
    }
  }

  function openSchedule(req: any) {
      setScheduleData({
          date: req.scheduled_start_at ? new Date(req.scheduled_start_at).toISOString().split('T')[0] : "",
          time: req.scheduled_start_at ? new Date(req.scheduled_start_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false}) : "",
          techId: req.technician_id || "",
          buddyId: req.second_technician_id || ""
      });
      setShowScheduleModal(true);
  }

  async function confirmSchedule() {
    if (!selectedReq) return;

    if (!scheduleData.date) {
      alert("Please select a date");
      return;
    }

    if (!scheduleData.techId) {
      alert("Please select a lead technician");
      return;
    }

    const whenISO = new Date(
      `${scheduleData.date}T${scheduleData.time || "09:00"}`
    ).toISOString();

    // Optimistic UI update
    setRequests(prev =>
      prev.map(r =>
        r.id === selectedReq.id
          ? {
              ...r,
              status: "SCHEDULED",
              scheduled_at: whenISO,
              tech: technicians.find(t => t.id === scheduleData.techId) || null,
              buddy: technicians.find(t => t.id === scheduleData.buddyId) || null
            }
          : r
      )
    );

    setShowScheduleModal(false);
    setSelectedReq(null);

    // Call backend API
    await fetch("/api/dispatch/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: selectedReq.id,
        when: whenISO,
        tech_ids: [
          scheduleData.techId,
          ...(scheduleData.buddyId ? [scheduleData.buddyId] : [])
        ],
        notes: null
      })
    });
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans">
        
       {/* TOP HEADER */}
       <div className="bg-white px-8 py-4 flex justify-between items-center border-b border-gray-200 sticky top-0 z-20 shadow-sm backdrop-blur-md bg-white/90">
          <div className="flex items-center gap-4">
            {/* APP NAME LOGO */}
            <div className="bg-black text-white px-3 py-1 rounded text-xl font-black tracking-tighter italic">
                REVLET
            </div>
            <div className="h-6 w-px bg-gray-200"></div>
            <div>
                <h1 className="font-bold text-gray-900 leading-none">Dispatch</h1>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">San Antonio Operations</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            
             {/* ALERT BELL SYSTEM */}
             <div className="relative">
                <button 
                  onClick={() => setShowAlerts(!showAlerts)}
                  className="relative p-2 rounded-full text-gray-400 hover:text-black hover:bg-gray-100 transition"
                >
                   <IconBell />
                   {alerts.length > 0 && (
                      <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                   )}
                </button>

                {/* ALERT DROPDOWN */}
                {showAlerts && (
                   <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                       <div className="px-4 py-3 border-b bg-gray-50 flex justify-between items-center">
                          <span className="text-xs font-black uppercase tracking-wider text-gray-500">Notifications</span>
                          {alerts.length > 0 && <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">{alerts.length} New</span>}
                       </div>
                       <div className="max-h-64 overflow-y-auto">
                          {alerts.length === 0 ? (
                             <div className="p-8 text-center text-gray-400 text-sm italic">
                                No new alerts at this time.
                             </div>
                          ) : (
                             alerts.map((a, i) => (
                                <div key={i} className="p-4 border-b border-gray-50 hover:bg-gray-50 transition cursor-default">
                                   <div className="flex gap-3">
                                      <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-500 shrink-0"></div>
                                      <div>
                                         <div className="text-sm font-bold text-gray-900 leading-tight mb-1">{a.title || "System Alert"}</div>
                                         <div className="text-xs text-gray-500 leading-relaxed">{a.message}</div>
                                         <div className="text-[10px] text-gray-400 mt-2 font-mono">{fmtDate(a.created_at)}</div>
                                      </div>
                                   </div>
                                </div>
                             ))
                          )}
                       </div>
                   </div>
                )}
             </div>

             <div className="h-6 w-px bg-gray-200 mx-2"></div>

             <div className="text-right hidden md:block">
                <div className="text-2xl font-black leading-none">{requests.length}</div>
                <div className="text-[10px] font-bold text-gray-400 uppercase">Active Jobs</div>
             </div>
             
             <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg transition">
                <IconLogout /> Logout
             </button>
          </div>
       </div>

       {/* BOARD COLUMNS */}
       <div className="flex-1 overflow-x-auto p-8">
          <DragDropContext onDragEnd={onDragEnd}>
             <div className="flex gap-8 h-full min-w-[1200px]">
                {COLUMNS.map(col => (
                   <div key={col.id} className={`flex-1 flex flex-col rounded-2xl border ${col.color} bg-white shadow-sm min-w-[350px]`}>
                      
                      {/* Column Header */}
                      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-2xl">
                         <h2 className="font-extrabold text-sm text-gray-600 uppercase tracking-wide flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${col.id === 'IN_PROGRESS' ? 'bg-green-500' : col.id === 'SCHEDULED' ? 'bg-blue-500' : 'bg-gray-400'}`}></div>
                            {col.label}
                         </h2>
                         <span className={`${col.badge} px-2.5 py-0.5 rounded-full text-xs font-black shadow-sm`}>
                            {requests.filter(r => r.status === col.id).length}
                         </span>
                      </div>

                      {/* Drop Zone */}
                      <Droppable droppableId={col.id}>
                         {(provided, snapshot) => (
                            <div 
                               {...provided.droppableProps} 
                               ref={provided.innerRef} 
                               className={`flex-1 p-3 space-y-3 transition-colors ${snapshot.isDraggingOver ? 'bg-gray-50' : ''}`}
                            >
                               {requests.filter(r => r.status === col.id).map((r, index) => {
                                   const hasParts = r.request_parts && r.request_parts.length > 0;
                                   const scheduledDate = r.scheduled_start_at ? new Date(r.scheduled_start_at) : null;
                                   const brand = getCustomerStyle(r.customer?.name);
                                   
                                   // Calculate Badge
                                   const badge = getLifecycleBadge(r);
                                   
                                   return (
                                   <Draggable key={r.id} draggableId={r.id} index={index}>
                                      {(provided, snapshot) => (
                                         <div 
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            onClick={() => setSelectedReq(r)}
                                            className={clsx(
                                                "bg-white p-4 rounded-xl border border-gray-100 shadow-sm cursor-pointer group relative overflow-hidden transition-all hover:shadow-md",
                                                snapshot.isDragging ? "shadow-2xl rotate-2 scale-105 z-50 ring-2 ring-blue-500" : ""
                                            )}
                                         >
                                            {/* Left Colored Strip (Status) */}
                                            <div className={clsx(
                                                "absolute left-0 top-0 bottom-0 w-1.5",
                                                r.status === 'IN_PROGRESS' ? "bg-green-500" : r.status === 'SCHEDULED' ? "bg-blue-500" : "bg-gray-300"
                                            )} />

                                            {/* --- CARD CONTENT --- */}
                                            <div className="pl-3">
                                                
                                                {/* Customer Brand Badge */}
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${brand.bg} ${brand.text} border ${brand.border}`}>
                                                          {r.customer?.name || "Unknown Client"}
                                                      </span>
                                                      
                                                      {/* Status Badge */}
                                                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${badge.cls}`}>
                                                        {badge.label}
                                                      </span>
                                                    </div>

                                                    {hasParts && (
                                                        <div className="bg-amber-100 text-amber-700 p-1 rounded-md" title="Parts Attached">
                                                            <IconParts />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Vehicle Info with Plate */}
                                                <h3 className="font-black text-gray-900 text-base leading-tight">
                                                    {r.vehicle?.year} {r.vehicle?.make} {r.vehicle?.model}
                                                </h3>
                                                
                                                <div className="flex flex-col mt-1 mb-3">
                                                    {r.vehicle?.unit_number && (
                                                        <div className="mb-1">
                                                            <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px] font-bold border border-gray-200">
                                                                #{r.vehicle.unit_number}
                                                            </span>
                                                        </div>
                                                    )}
                                                    
                                                    {/* PLATE INFO */}
                                                    <span className="text-[10px] font-mono text-gray-400">
                                                      {r.vehicle?.plate ? `Plate: ${r.vehicle.plate}` : "NO PLATE"}
                                                    </span>
                                                </div>

                                                {/* Service Description */}
                                                <p className="text-sm font-medium text-gray-600 line-clamp-2 mb-3">{r.service_title}</p>

                                                {/* Footer: Date & Crew */}
                                                <div className="pt-3 border-t border-gray-50 flex justify-between items-center">
                                                    
                                                    {/* Date Pill */}
                                                    {scheduledDate ? (
                                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-md">
                                                            <IconCalendar />
                                                            <span>{scheduledDate.toLocaleDateString(undefined, { month:'short', day:'numeric' })}</span>
                                                            <span className="text-blue-300">|</span>
                                                            <span>{scheduledDate.toLocaleTimeString(undefined, { hour:'numeric', minute:'2-digit' })}</span>
                                                        </div>
                                                    ) : (
                                                        <div className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-md">Unscheduled</div>
                                                    )}

                                                    {/* Completion Badge */}
                                                    {r.completed_at && (
                                                      <span className="ml-2 text-[10px] font-bold bg-black text-white px-2 py-0.5 rounded">
                                                        Completed by {r.completed_by_role}
                                                      </span>
                                                    )}

                                                    {/* Mini Lifecycle Button (Optional, keeping it functional) */}
                                                    {!r.completed_at && (
                                                      <button
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          setSelectedReq(r);
                                                          openLifecycle(r);
                                                        }}
                                                        className="text-[10px] font-black uppercase tracking-wider text-gray-400 hover:text-black ml-auto mr-2"
                                                      >
                                                        Lifecycle
                                                      </button>
                                                    )}

                                                    {/* Crew Avatars */}
                                                    <div className="flex -space-x-2">
                                                        {r.tech ? (
                                                          <div
                                                            className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-bold ring-2 ring-white"
                                                            title={`Lead: ${r.tech.full_name || "Unassigned"}`}
                                                          >
                                                            {r.tech?.full_name?.charAt(0) || "?"}
                                                          </div>
                                                        ) : (
                                                          <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center ring-2 ring-white border border-dashed border-gray-300">
                                                            <IconUser />
                                                          </div>
                                                        )}
                                                        
                                                        {r.buddy && (
                                                          <div
                                                            className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] font-bold ring-2 ring-white"
                                                            title={`Buddy: ${r.buddy.full_name || "Unassigned"}`}
                                                          >
                                                            {r.buddy?.full_name?.charAt(0) || "?"}
                                                          </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                         </div>
                                      )}
                                   </Draggable>
                                )})}
                                {provided.placeholder}
                             </div>
                          )}
                       </Droppable>
                    </div>
                 ))}
             </div>
          </DragDropContext>
       </div>

       {/* --- DETAILS MODAL --- */}
       {selectedReq && !showScheduleModal && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200">
             <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden transform transition-all scale-100">
                {/* Modal Header */}
                <div className="bg-gray-50 px-8 py-6 border-b border-gray-100 flex justify-between items-start">
                   <div>
                      <h2 className="text-2xl font-black text-gray-900 leading-none mb-2">{selectedReq.service_title}</h2>
                      <div className="flex gap-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                        <span>ID: #{selectedReq.id.slice(0, 6)}</span>
                        <span>•</span>
                        <span>{selectedReq.status.replace(/_/g, " ")}</span>
                      </div>
                   </div>
                   <button onClick={() => setSelectedReq(null)} className="p-2 bg-gray-200 hover:bg-gray-300 rounded-full transition">
                        <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                   </button>
                </div>
                
                {/* Modal Body */}
                <div className="p-8 space-y-8">
                   <div className="grid grid-cols-2 gap-8">
                      {/* BRANDED CUSTOMER BOX */}
                      <div className={`p-4 rounded-xl border ${getCustomerStyle(selectedReq.customer?.name).bg} ${getCustomerStyle(selectedReq.customer?.name).border}`}>
                         <label className={`text-[10px] font-black uppercase tracking-wider block mb-2 ${getCustomerStyle(selectedReq.customer?.name).text}`}>Customer</label>
                         <div className="font-bold text-lg text-gray-900">{selectedReq.customer?.name}</div>
                         <div className="text-sm text-gray-500 mt-1">{selectedReq.customer?.address || "No address on file"}</div>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-2">Vehicle Asset</label>
                         <div className="font-bold text-lg text-gray-900">{selectedReq.vehicle?.year} {selectedReq.vehicle?.model}</div>
                         <div className="flex gap-2 mt-2">
                            <span className="bg-white px-2 py-1 rounded border text-xs font-mono font-bold text-gray-600">{selectedReq.vehicle?.plate}</span>
                            {selectedReq.vehicle?.unit_number && <span className="bg-black text-white px-2 py-1 rounded text-xs font-bold">UNIT {selectedReq.vehicle.unit_number}</span>}
                         </div>
                      </div>
                   </div>

                   {/* Parts List */}
                   <div>
                      <div className="flex items-center gap-2 mb-3">
                          <IconParts />
                          <label className="text-xs font-black text-gray-900 uppercase tracking-wider">Parts Manifest</label>
                      </div>
                      <div className="bg-amber-50 rounded-xl border border-amber-100 overflow-hidden">
                          {selectedReq.request_parts && selectedReq.request_parts.length > 0 ? (
                              <div className="divide-y divide-amber-100">
                                 {selectedReq.request_parts.map((p: any) => (
                                    <div key={p.id} className="flex justify-between items-center p-3 hover:bg-amber-100/50 transition">
                                       <div>
                                            <div className="text-sm font-bold text-gray-900">{p.part_name}</div>
                                            <div className="text-xs text-amber-700 font-mono">{p.part_number || "N/A"}</div>
                                       </div>
                                       <div className="text-sm font-bold bg-white text-amber-800 px-3 py-1 rounded-lg shadow-sm border border-amber-100">Qty: {p.quantity}</div>
                                    </div>
                                 ))}
                              </div>
                          ) : (
                              <div className="p-6 text-center text-amber-800/50 text-sm italic">No specific parts required for this job.</div>
                          )}
                      </div>
                   </div>
                </div>

                {/* Modal Footer with LIFECYCLE BUTTON */}
                <div className="bg-gray-50 px-8 py-5 border-t border-gray-100 flex justify-end gap-4">
                  <button
                    onClick={() => setSelectedReq(null)}
                    className="px-6 py-3 text-sm font-bold text-gray-600 hover:text-gray-900 transition"
                  >
                    Close Preview
                  </button>

                  <button
                    onClick={() => openLifecycle(selectedReq)}
                    className="px-6 py-3 bg-white text-black text-sm font-bold rounded-xl border border-gray-200 hover:border-black transition"
                  >
                    View Lifecycle
                  </button>

                  <button
                    onClick={() => openSchedule(selectedReq)}
                    className="px-6 py-3 bg-black text-white text-sm font-bold rounded-xl shadow-lg hover:bg-gray-800 transform active:scale-95 transition flex items-center gap-2"
                  >
                    <span>Manage Schedule & Crew</span>
                    <span>&rarr;</span>
                  </button>
                </div>
             </div>
          </div>
       )}

       {/* --- SCHEDULE MODAL --- */}
       {showScheduleModal && (
           <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
               <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8 animate-in slide-in-from-bottom-8 duration-300">
                   <h2 className="text-xl font-black text-gray-900 mb-6">Assign Crew & Schedule</h2>
                   
                   <div className="space-y-5">
                       <div>
                           <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">Target Date & Time</label>
                           <div className="flex gap-3">
                               <input type="date" className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 focus:ring-2 focus:ring-black outline-none" value={scheduleData.date} onChange={e => setScheduleData({...scheduleData, date: e.target.value})} />
                               <input type="time" className="w-1/3 p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 focus:ring-2 focus:ring-black outline-none" value={scheduleData.time} onChange={e => setScheduleData({...scheduleData, time: e.target.value})} />
                           </div>
                       </div>
                       
                       <div className="pt-2">
                           <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">Lead Technician <span className="text-red-500">*</span></label>
                           <div className="relative">
                               <select 
                                   className="w-full p-4 bg-white border-2 border-gray-100 rounded-xl font-bold text-gray-900 appearance-none focus:border-black outline-none transition"
                                   value={scheduleData.techId} 
                                   onChange={e => setScheduleData({...scheduleData, techId: e.target.value})}
                               >
                                   <option value="">Select Tech...</option>
                                   {technicians.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                               </select>
                               <div className="absolute right-4 top-4 pointer-events-none text-gray-400">▼</div>
                           </div>
                       </div>

                       <div>
                           <label className="block text-[10px] font-black text-purple-400 uppercase tracking-wider mb-2">Buddy Tech (Support)</label>
                           <div className="relative">
                               <select 
                                   className="w-full p-4 bg-purple-50 border-2 border-purple-100 rounded-xl font-bold text-purple-900 appearance-none focus:border-purple-500 outline-none transition"
                                   value={scheduleData.buddyId} 
                                   onChange={e => setScheduleData({...scheduleData, buddyId: e.target.value})}
                               >
                                   <option value="">No Buddy Needed</option>
                                   {technicians.map(t => (
                                       t.id !== scheduleData.techId && <option key={t.id} value={t.id}>{t.full_name}</option>
                                   ))}
                               </select>
                               <div className="absolute right-4 top-4 pointer-events-none text-purple-400">▼</div>
                           </div>
                       </div>
                   </div>

                   <div className="flex gap-4 mt-8 pt-6 border-t border-gray-100">
                       <button onClick={() => setShowScheduleModal(false)} className="flex-1 py-4 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded-xl transition">Cancel</button>
                       <button onClick={confirmSchedule} className="flex-1 py-4 bg-black text-white text-sm font-bold rounded-xl shadow-lg hover:bg-gray-900 transform active:scale-[0.98] transition">Confirm Assignment</button>
                   </div>
               </div>
           </div>
       )}

       {/* --- LIFECYCLE MODAL (READ-ONLY) --- */}
        {showLifecycleModal && selectedReq && (
        <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between bg-gray-50">
                <div>
                <div className="text-xs font-black text-gray-400 uppercase tracking-wider">Lifecycle</div>
                <div className="text-lg font-black text-gray-900">
                    {selectedReq.vehicle?.plate || "NO PLATE"} • {selectedReq.service_title}
                </div>
                </div>

                <button
                onClick={() => {
                    setShowLifecycleModal(false);
                    setLifecycle(null);
                    setLifecycleError(null);
                }}
                className="p-2 rounded-full bg-gray-200 hover:bg-gray-300"
                >
                <svg className="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                </button>
            </div>

            <div className="p-6 space-y-4">
                {lifecycleLoading && (
                <div className="text-sm text-gray-500 animate-pulse">Loading lifecycle…</div>
                )}

                {lifecycleError && (
                <div className="text-sm text-red-600 font-bold">Failed: {lifecycleError}</div>
                )}

                {!lifecycleLoading && !lifecycleError && lifecycle && (
                <div className="space-y-3 text-sm">
                    <Row label="Created" value={fmtDate(lifecycle.created_at)} />
                    <Row label="Scheduled" value={fmtDate(lifecycle.scheduled_start_at)} />
                    <Row label="Started" value={fmtDate(lifecycle.started_at)} />
                    <Row label="Waiting for Parts" value={fmtDate(lifecycle.waiting_for_parts_at)} />
                    <Row label="Waiting for Approval" value={fmtDate(lifecycle.waiting_for_approval_at)} />
                    <Row label="Completed" value={fmtDate(lifecycle.completed_at)} />
                    <Row label="Completed By" value={lifecycle.completed_by_role || "—"} />

                    <div className="pt-3 border-t">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Tech Notes</div>
                    <div className="bg-gray-50 border rounded-xl p-3 text-gray-700 whitespace-pre-wrap">
                        {lifecycle.technician_notes || "—"}
                    </div>
                    </div>

                    <div>
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Dispatch Notes</div>
                    <div className="bg-gray-50 border rounded-xl p-3 text-gray-700 whitespace-pre-wrap">
                        {lifecycle.dispatch_notes || "—"}
                    </div>
                    </div>

                    <div>
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Office Notes</div>
                    <div className="bg-gray-50 border rounded-xl p-3 text-gray-700 whitespace-pre-wrap">
                        {lifecycle.office_notes || "—"}
                    </div>
                    </div>
                </div>
                )}
            </div>

            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
                <button
                onClick={() => setShowLifecycleModal(false)}
                className="px-5 py-2.5 rounded-xl bg-black text-white text-sm font-bold hover:bg-gray-800"
                >
                Close
                </button>
            </div>
            </div>
        </div>
        )}
    </div>
  );
}