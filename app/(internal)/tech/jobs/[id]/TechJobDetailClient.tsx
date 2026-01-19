"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { createBrowserClient } from "@supabase/ssr";

// --- ICONS ---
const IconBack = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>;
const IconCamera = () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const IconCheck = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>;
const IconAlert = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
const IconClipboard = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>;
const IconTraffic = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>;

const INSPECTION_POINTS = ["Wipers", "Lights", "Tires", "Brakes", "Fluids", "Battery", "Belts", "Air Filter", "Glass"];

type InspectionStatus = "GREEN" | "YELLOW" | "RED" | null;

export default function TechJobDetailClient({ request, userId }: { request: any, userId: string }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [status, setStatus] = useState(request.status);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState(request.technician_notes || "");
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [inspectionData, setInspectionData] = useState<Record<string, InspectionStatus>>({});

  const isStarted = status === "IN_PROGRESS";
  const isCompleted = status === "COMPLETED";
  const isPending = !isStarted && !isCompleted;
  const today = new Date(); today.setHours(0,0,0,0);
  const jobDate = request.scheduled_start_at ? new Date(request.scheduled_start_at) : new Date();
  jobDate.setHours(0,0,0,0);
  const isFuture = jobDate.getTime() > today.getTime();

  // --- INSPECTION LOGIC ---
  const togglePoint = (point: string, val: InspectionStatus) => {
      setInspectionData(prev => ({ ...prev, [point]: val }));
  };

  const getInspectionSummary = () => {
      const red = Object.values(inspectionData).filter(v => v === 'RED').length;
      const yellow = Object.values(inspectionData).filter(v => v === 'YELLOW').length;
      const green = Object.values(inspectionData).filter(v => v === 'GREEN').length;
      return { red, yellow, green, total: red + yellow + green };
  };

  const attemptComplete = () => {
      const { total } = getInspectionSummary();
      if (total < INSPECTION_POINTS.length) {
          setShowInspectionModal(true); // Force open modal
          return;
      }
      if (confirm("Are you sure you want to finish this job?")) {
          updateStatus("COMPLETED");
      }
  };

  async function updateStatus(newStatus: string, extraNotes?: string) {
    if (newStatus === "IN_PROGRESS" && isFuture) return alert("Locked.");
    
    setLoading(true);
    
    // Format Inspection for Office/Customer
    let finalNotes = extraNotes ? `${notes}\n\n${extraNotes}` : notes;
    
    if (newStatus === "COMPLETED") {
        const report = Object.entries(inspectionData).map(([k, v]) => {
            const icon = v === 'RED' ? '🔴 REQUIRED' : v === 'YELLOW' ? '🟡 RECOMMENDED' : '🟢 GOOD';
            return `${icon} - ${k}`;
        }).join('\n');
        finalNotes = `${finalNotes}\n\n--- 9-POINT INSPECTION ---\n${report}`;
    }

    try {
        const res = await fetch(`/api/tech/requests/${request.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                status: newStatus, 
                notes: finalNotes,
                technician_id: newStatus === "READY_TO_SCHEDULE" ? null : userId
            })
        });

        if (res.ok) {
            if (newStatus === "READY_TO_SCHEDULE" || newStatus === "COMPLETED") {
                router.push("/tech");
            } else {
                setStatus(newStatus);
                router.refresh();
            }
        }
    } catch (e) { alert("Error"); } finally { setLoading(false); }
  }

  const handleReschedule = () => {
      const reason = prompt("Reason:");
      if (reason) updateStatus("READY_TO_SCHEDULE", `RESCHEDULED: ${reason}`);
  };

  return (
    <div className="min-h-screen bg-black text-white pb-40 font-sans relative">
      
      {/* HEADER */}
      <div className="bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800 px-4 py-4 sticky top-0 z-30 flex items-center gap-4">
         <button onClick={() => router.back()} className="p-2 bg-zinc-800 rounded-xl text-zinc-400 active:scale-90 transition"><IconBack /></button>
         <div>
            <div className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">{status.replace("_", " ")}</div>
            <h1 className="font-black text-lg leading-none text-white">{request.customer?.name}</h1>
         </div>
      </div>

      <div className="p-5 space-y-6">
         
         {/* INFO CARD */}
         <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800">
             <div className="flex gap-2 mb-3">
                 <span className="bg-white text-black px-2 py-1 rounded text-xs font-mono font-black">{request.vehicle?.plate || "NO PLATE"}</span>
                 <span className="bg-zinc-800 text-zinc-300 px-2 py-1 rounded text-xs font-bold">{request.vehicle?.year} {request.vehicle?.model}</span>
             </div>
             <h2 className="text-xl font-bold text-white mb-2">{request.service_title}</h2>
             <p className="text-sm text-zinc-400 bg-black/30 p-3 rounded-xl border border-zinc-800/50">
                 {request.service_description || request.description || "No instructions provided."}
             </p>
         </div>

         {/* INSPECTION BUTTON (Only when Started) */}
         {isStarted && (
             <button 
                onClick={() => setShowInspectionModal(true)}
                className="w-full bg-zinc-800 border border-zinc-700 p-4 rounded-2xl flex justify-between items-center active:bg-zinc-700 transition"
             >
                 <div className="flex items-center gap-3">
                     <div className="bg-blue-600/20 text-blue-500 p-2 rounded-lg"><IconClipboard /></div>
                     <div className="text-left">
                         <div className="font-bold text-sm text-white uppercase tracking-wide">9-Point Inspection</div>
                         <div className="text-[10px] text-zinc-400 font-bold">Required to complete job</div>
                     </div>
                 </div>
                 <div className="flex gap-1">
                     {getInspectionSummary().red > 0 && <span className="bg-red-500 text-black text-[10px] font-black px-1.5 py-0.5 rounded">{getInspectionSummary().red}</span>}
                     {getInspectionSummary().yellow > 0 && <span className="bg-amber-400 text-black text-[10px] font-black px-1.5 py-0.5 rounded">{getInspectionSummary().yellow}</span>}
                     {getInspectionSummary().green > 0 && <span className="bg-green-500 text-black text-[10px] font-black px-1.5 py-0.5 rounded">{getInspectionSummary().green}</span>}
                 </div>
             </button>
         )}

         {/* NOTES */}
         <textarea 
             className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm text-white focus:border-blue-600 outline-none min-h-[100px]"
             placeholder="Technician notes..."
             value={notes}
             onChange={(e) => setNotes(e.target.value)}
         />
      </div>

      {/* FOOTER ACTIONS */}
      <div className="fixed bottom-24 left-0 w-full px-4 z-40">
          <div className="flex gap-3">
            {isPending && (
                <>
                    <button onClick={handleReschedule} disabled={loading} className="flex-1 bg-zinc-800 text-red-400 font-bold text-xs uppercase py-4 rounded-xl border border-zinc-700 active:scale-95 shadow-xl">Reschedule</button>
                    <button onClick={() => updateStatus("IN_PROGRESS")} disabled={loading || isFuture} className={clsx("flex-[2] font-black text-lg py-4 rounded-xl shadow-xl active:scale-95 transition", isFuture ? "bg-zinc-800 text-zinc-500 cursor-not-allowed" : "bg-blue-600 text-white shadow-blue-900/30")}>
                        {isFuture ? "Locked" : "START REPAIR"}
                    </button>
                </>
            )}
            
            {isStarted && (
                <button onClick={attemptComplete} disabled={loading} className="w-full bg-green-600 text-white font-black text-lg py-4 rounded-xl shadow-xl shadow-green-900/20 active:scale-[0.95] transition">
                    COMPLETE JOB
                </button>
            )}

            {isCompleted && (
                <div className="w-full bg-zinc-800 text-zinc-500 font-bold text-center py-4 rounded-xl border border-zinc-700">Job Completed</div>
            )}
          </div>
      </div>

      {/* --- INSPECTION MODAL --- */}
      {showInspectionModal && (
          <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm p-4 animate-in slide-in-from-bottom-10 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-black italic tracking-tighter text-white uppercase">Inspection</h2>
                  <button onClick={() => setShowInspectionModal(false)} className="bg-zinc-800 px-3 py-1 rounded-lg text-xs font-bold text-zinc-400">Close</button>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-3 pb-20">
                  {INSPECTION_POINTS.map(point => (
                      <div key={point} className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
                          <div className="flex justify-between items-center mb-3">
                              <span className="font-bold text-sm text-white">{point}</span>
                              <div className="text-[10px] font-black bg-black px-2 py-0.5 rounded text-zinc-500">
                                  {inspectionData[point] || "PENDING"}
                              </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                              <button onClick={() => togglePoint(point, "GREEN")} className={clsx("py-3 rounded-xl text-xs font-black uppercase transition", inspectionData[point] === "GREEN" ? "bg-green-600 text-white shadow-lg shadow-green-900/20" : "bg-zinc-800 text-zinc-500")}>
                                  Good
                              </button>
                              <button onClick={() => togglePoint(point, "YELLOW")} className={clsx("py-3 rounded-xl text-xs font-black uppercase transition", inspectionData[point] === "YELLOW" ? "bg-amber-400 text-black shadow-lg shadow-amber-900/20" : "bg-zinc-800 text-zinc-500")}>
                                  Future
                              </button>
                              <button onClick={() => togglePoint(point, "RED")} className={clsx("py-3 rounded-xl text-xs font-black uppercase transition", inspectionData[point] === "RED" ? "bg-red-600 text-white shadow-lg shadow-red-900/20" : "bg-zinc-800 text-zinc-500")}>
                                  Urgent
                              </button>
                          </div>
                      </div>
                  ))}
              </div>
              
              <div className="pt-4 border-t border-zinc-800">
                  <button 
                      onClick={() => setShowInspectionModal(false)}
                      className="w-full py-4 bg-white text-black font-black uppercase rounded-xl shadow-lg active:scale-95 transition"
                  >
                      Save Progress
                  </button>
              </div>
          </div>
      )}

    </div>
  );
}