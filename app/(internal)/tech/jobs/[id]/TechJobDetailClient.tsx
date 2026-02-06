"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { createBrowserClient } from "@supabase/ssr";
import TechPhotoUpload from "@/components/tech/TechPhotoUpload"; 

// --- ICONS ---
const IconBack = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>;
const IconClipboard = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>;
const IconKey = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>;

const INSPECTION_POINTS = ["Wipers", "Lights", "Tires", "Brakes", "Fluids", "Battery", "Belts", "Air Filter", "Glass"];

type InspectionStatus = "GREEN" | "YELLOW" | "RED" | null;

export default function TechJobDetailClient({ request, userId }: { request: any, userId: string }) {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [status, setStatus] = useState(request.status);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState(request.technician_notes || "");
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [inspectionData, setInspectionData] = useState<Record<string, InspectionStatus>>({});

  const isStarted = status === "IN_PROGRESS";
  const isCompleted = status === "COMPLETED" || status === "BILLED" || status === "CANCELED";
  const isPending = !isStarted && !isCompleted; // NEW, SCHEDULED, EN_ROUTE
  
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

  const attemptComplete = async () => {
      const { total } = getInspectionSummary();
      
      if (total < INSPECTION_POINTS.length) {
          alert("Please complete the 9-Point Inspection before finishing.");
          setShowInspectionModal(true);
          return;
      }

      if (!confirm("Are you sure you want to finish this job?")) return;
      
      setLoading(true);

      const report = Object.entries(inspectionData).map(([k, v]) => {
            const icon = v === 'RED' ? '🔴 REQUIRED' : v === 'YELLOW' ? '🟡 RECOMMENDED' : '🟢 GOOD';
            return `${icon} - ${k}`;
      }).join('\n');
      
      const finalNotes = `${notes}\n\n--- 9-POINT INSPECTION ---\n${report}`;

      try {
          const res = await fetch(`/api/tech/job/${request.id}/complete`, { 
             method: "POST",
             headers: { "Content-Type": "application/json" },
             body: JSON.stringify({ final_notes: finalNotes }) 
          });

          if (!res.ok) throw new Error("API Failed");
          router.push("/tech");

      } catch (err) {
          console.error(err);
          alert("Error completing job. Please try again.");
          setLoading(false);
      }
  };

  async function updateStatus(newStatus: string) {
    if (newStatus === "IN_PROGRESS" && isFuture) return alert("This job is scheduled for the future. You cannot start it yet.");
    setLoading(true);
    
    try {
        const res = await fetch(`/api/tech/requests/${request.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                status: newStatus, 
                notes: notes,
                technician_id: newStatus === "READY_TO_SCHEDULE" ? null : userId
            })
        });

        if (res.ok) {
            setStatus(newStatus);
            router.refresh();
        }
    } catch (e) { alert("Error updating status"); } finally { setLoading(false); }
  }

  const handleReschedule = () => {
      const reason = prompt("Reason for rescheduling:");
      if (reason) {
          updateStatus("RESCHEDULE_PENDING");
          setNotes((prev: string) => `TECH RESCHEDULE REQUEST: ${reason}\n\n${prev}`);
      }
  };

  const handleImageUploaded = () => {
    router.refresh(); 
  };

  // ✅ INCREASED PADDING TO PREVENT FOOTER OVERLAP
  return (
    <div className="min-h-screen bg-black text-white pb-48 font-sans relative">
      
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

              {request.key_location && (
                  <div className="mb-4 bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl flex items-start gap-3">
                      <div className="text-amber-500"><IconKey /></div>
                      <div>
                          <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Key Location</div>
                          <div className="text-white font-bold text-sm">{request.key_location}</div>
                      </div>
                  </div>
              )}

              <h2 className="text-xl font-bold text-white mb-2">{request.service_title}</h2>
              <p className="text-sm text-zinc-400 bg-black/30 p-3 rounded-xl border border-zinc-800/50">
                  {request.service_description || request.description || "No instructions provided."}
              </p>
          </div>

          {/* VISUAL PROOF */}
          {request.request_images && request.request_images.length > 0 && (
            <div>
              <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-3 px-1">Visual Proof</h3>
              <div className="grid grid-cols-2 gap-3">
                {request.request_images.map((img: any) => (
                  <div key={img.id} className="relative aspect-video bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800">
                    <img src={img.url_full} className="w-full h-full object-cover opacity-90" alt="Evidence" />
                    <div className="absolute bottom-0 left-0 w-full bg-black/60 p-1.5 backdrop-blur-md">
                       <span className="text-[9px] font-bold text-white uppercase px-1.5 py-0.5 rounded border border-white/20">
                          {img.kind || "Photo"}
                       </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* INSPECTION BUTTON */}
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

          {/* NOTES & UPLOAD */}
          <div>
             <textarea 
                 className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm text-white focus:border-blue-600 outline-none min-h-[100px] mb-4"
                 placeholder="Technician notes..."
                 value={notes}
                 onChange={(e) => setNotes(e.target.value)}
             />
             <button 
                onClick={() => setShowUpload(true)}
                className="w-full py-4 rounded-xl border border-dashed border-zinc-700 text-zinc-400 font-bold uppercase text-xs tracking-widest hover:bg-zinc-900 hover:text-white transition"
             >
                + Add Photo Evidence
             </button>
          </div>
      </div>

      {/* ✅ FIXED FOOTER: Floating above everything with high Z-Index */}
      <div className="fixed bottom-0 left-0 w-full bg-black/95 backdrop-blur-lg border-t border-zinc-800 p-4 pb-8 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
          <div className="flex gap-3">
            {isPending && (
                <>
                    <button onClick={handleReschedule} disabled={loading} className="flex-1 bg-zinc-800 text-red-400 font-bold text-xs uppercase py-4 rounded-xl border border-zinc-700 active:scale-95 shadow-xl">Reschedule</button>
                    
                    {/* EN ROUTE BUTTON (Shows if Scheduled OR New) */}
                    {status === "SCHEDULED" || status === "NEW" || status === "READY_TO_SCHEDULE" ? (
                        <button 
                            onClick={() => updateStatus("EN_ROUTE")} 
                            disabled={loading}
                            className="flex-[2] bg-purple-600 text-white font-black text-lg py-4 rounded-xl shadow-xl shadow-purple-900/30 active:scale-95 transition"
                        >
                            {loading ? "..." : "I'm En Route 🚗"}
                        </button>
                    ) : (
                        <button 
                            onClick={() => updateStatus("IN_PROGRESS")} 
                            disabled={loading} 
                            className="flex-[2] bg-green-600 text-white font-black text-lg py-4 rounded-xl shadow-xl shadow-green-900/30 active:scale-95 transition"
                        >
                            {loading ? "..." : "START REPAIR 🛠️"}
                        </button>
                    )}
                </>
            )}
            
            {isStarted && (
                <button onClick={attemptComplete} disabled={loading} className="w-full bg-blue-600 text-white font-black text-lg py-4 rounded-xl shadow-xl shadow-blue-900/20 active:scale-[0.95] transition">
                    {loading ? "SAVING..." : "COMPLETE JOB"}
                </button>
            )}

            {isCompleted && (
                <div className="w-full bg-zinc-800 text-zinc-500 font-bold text-center py-4 rounded-xl border border-zinc-700">Job Completed</div>
            )}
          </div>
      </div>

      {/* INSPECTION MODAL */}
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
                              <button onClick={() => togglePoint(point, "GREEN")} className={clsx("py-3 rounded-xl text-xs font-black uppercase transition", inspectionData[point] === "GREEN" ? "bg-green-600 text-white" : "bg-zinc-800 text-zinc-500")}>Good</button>
                              <button onClick={() => togglePoint(point, "YELLOW")} className={clsx("py-3 rounded-xl text-xs font-black uppercase transition", inspectionData[point] === "YELLOW" ? "bg-amber-400 text-black" : "bg-zinc-800 text-zinc-500")}>Future</button>
                              <button onClick={() => togglePoint(point, "RED")} className={clsx("py-3 rounded-xl text-xs font-black uppercase transition", inspectionData[point] === "RED" ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-500")}>Urgent</button>
                          </div>
                      </div>
                  ))}
              </div>
              
              <div className="pt-4 border-t border-zinc-800">
                  <button onClick={() => setShowInspectionModal(false)} className="w-full py-4 bg-white text-black font-black uppercase rounded-xl shadow-lg active:scale-95 transition">Save Progress</button>
              </div>
          </div>
      )}

      {/* UPLOAD MODAL */}
      {showUpload && (
         <TechPhotoUpload 
            requestId={request.id} 
            onUploaded={handleImageUploaded} 
            onClose={() => setShowUpload(false)} 
            autoCategoryFromStatus={request.status}
         />
      )}

    </div>
  );
}