"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import Image from "next/image";

// --- ICONS ---
const IconBack = () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>;
const IconMap = () => <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const IconPhone = () => <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>;
const IconBox = () => <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>;
const IconCamera = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const IconCheck = () => <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>;

const INSPECTION_POINTS = [
  "Brake Fluid / Lines", "Tire Pressure / Tread", "Oil Level / Condition", 
  "Coolant Level", "Belts & Hoses", "Battery Terminals", 
  "Wipers / Washers", "Lights (Head/Tail/Brake)", "Undercarriage Check"
];

export default function TechRequestDetailClient({ request: initialRequest }: { request: any }) {
  const router = useRouter();
  const [req, setReq] = useState(initialRequest);
  const [loading, setLoading] = useState(false);
  const [showKickback, setShowKickback] = useState(false);
  const [kickbackReason, setKickbackReason] = useState("");
  
  // Inspection State
  const [showInspection, setShowInspection] = useState(false);
  const [inspectionData, setInspectionData] = useState<Record<string, string>>({});

  // Visuals
  const v = req.vehicle || {};
  const c = req.customer || {};
  const isStarted = req.status === "IN_PROGRESS";
  const isCompleted = req.status === "COMPLETED";

  // Actions
  async function updateStatus(status: string) {
    if(!confirm(`Update status to ${status.replace(/_/g, ' ')}?`)) return;
    setLoading(true);
    const res = await fetch(`/api/tech/requests/${req.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
    });
    const js = await res.json();
    setLoading(false);
    if(js.ok) setReq(js.request);
  }

  async function handleKickback() {
     if (!kickbackReason.trim()) return alert("Reason required.");
     setLoading(true);
     const newNotes = `[TECH RETURN]: ${kickbackReason}\n\n` + (req.office_notes || "");
     const res = await fetch(`/api/tech/requests/${req.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "WAITING", office_notes: newNotes })
    });
    setLoading(false);
    if (res.ok) router.push("/tech");
  }

  // Mock Upload (In real app, this goes to Supabase Storage)
  async function handleProofUpload(e: any) {
    if(e.target.files?.[0]) {
        alert("Photo selected! (Upload logic would run here)");
        // In production: Upload to supabase, get URL, save to 'request_images' table
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-40">
       
       {/* 1. NAV BAR */}
       <div className="bg-black text-white px-4 py-4 sticky top-0 z-20 flex items-center gap-4 shadow-md">
          <button onClick={() => router.back()} className="p-1 hover:bg-white/20 rounded-full transition">
             <IconBack />
          </button>
          <div className="flex-1">
             <div className="flex items-center gap-2">
                <span className="font-bold text-lg">{v.year} {v.model}</span>
                {v.unit_number && <span className="bg-yellow-400 text-black text-[10px] font-black px-1.5 py-0.5 rounded">UNIT {v.unit_number}</span>}
             </div>
             <p className="text-xs text-gray-400 font-mono mt-0.5 uppercase tracking-wide">{v.plate || "NO PLATE"} • {v.make}</p>
          </div>
          <div className={clsx("px-2 py-1 rounded text-xs font-bold uppercase", isStarted ? "bg-green-500 text-black" : "bg-white/20 text-white")}>
             {req.status.replace(/_/g, " ")}
          </div>
       </div>

       <div className="p-4 space-y-4 max-w-lg mx-auto">

          {/* 2. CUSTOMER INTEL (Photos & Notes) */}
          {(req.notes || (req.request_images && req.request_images.length > 0)) && (
             <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-blue-500">
                <h3 className="text-xs font-bold text-blue-900 uppercase mb-3">Customer Intelligence</h3>
                
                {/* Customer Notes */}
                {req.notes && <p className="text-sm text-gray-800 italic mb-4">"{req.notes}"</p>}
                
                {/* Customer Photos */}
                {req.request_images && req.request_images.length > 0 && (
                   <div className="grid grid-cols-4 gap-2">
                      {req.request_images.map((img: any) => (
                         <a key={img.id} href={img.url_full} target="_blank" className="aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200 relative">
                            <Image src={img.url_full} alt="Customer Issue" fill className="object-cover" />
                         </a>
                      ))}
                   </div>
                )}
             </div>
          )}

          {/* 3. PARTS MANIFEST */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border-l-4 border-amber-500">
             <div className="bg-amber-50 px-4 py-3 flex justify-between items-center border-b border-amber-100">
                <div className="flex items-center gap-2">
                   <IconBox />
                   <h3 className="text-sm font-bold text-amber-900 uppercase tracking-wide">Parts Manifest</h3>
                </div>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded-full">CHECK TRUCK</span>
             </div>
             <div className="p-4">
                {req.request_parts && req.request_parts.length > 0 ? (
                    <div className="space-y-3">
                        {req.request_parts.map((p: any) => (
                            <div key={p.id} className="flex justify-between border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                                <div>
                                    <div className="font-bold text-gray-900">{p.part_name}</div>
                                    <div className="text-xs text-gray-500 font-mono">#{p.part_number || "N/A"}</div>
                                </div>
                                <div className="text-xl font-bold text-gray-400">x{p.quantity}</div>
                            </div>
                        ))}
                    </div>
                ) : <div className="text-center text-gray-400 text-sm italic">No parts listed.</div>}
             </div>
          </div>
          
          {/* 4. OFFICE / DISPATCH NOTES */}
          {req.office_notes && (
             <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-purple-500">
                <h3 className="text-xs font-bold text-purple-900 uppercase mb-2">Dispatch Instructions</h3>
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{req.office_notes}</p>
             </div>
          )}

          {/* 5. PROOF OF REPAIR & INSPECTION */}
          {isStarted && (
             <div className="space-y-3">
                {/* Proof of Repair Upload */}
                <div className="bg-white rounded-xl shadow-sm p-4">
                   <h3 className="text-xs font-bold text-gray-400 uppercase mb-3">Proof of Repair</h3>
                   <label className="flex items-center gap-3 p-3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-black transition">
                      <div className="p-2 bg-gray-100 rounded-full"><IconCamera /></div>
                      <div>
                         <span className="font-bold text-sm block">Take "After" Photo</span>
                         <span className="text-xs text-gray-500">Required for completion</span>
                      </div>
                      <input type="file" accept="image/*" className="hidden" onChange={handleProofUpload} />
                   </label>
                </div>

                {/* 9-Point Inspection */}
                <button 
                   onClick={() => setShowInspection(true)}
                   className="w-full bg-blue-600 text-white p-4 rounded-xl shadow-sm flex justify-between items-center font-bold"
                >
                   <span className="flex items-center gap-2">📋 Perform 9-Point Inspection</span>
                   <span className="text-xs bg-blue-800 px-2 py-1 rounded">REQUIRED</span>
                </button>
             </div>
          )}

          {/* 6. LOCATION */}
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
             <div className="bg-blue-50 p-3 rounded-full text-blue-600"><IconMap /></div>
             <div className="flex-1">
                 <h3 className="text-xs font-bold text-gray-400 uppercase">Location</h3>
                 <p className="font-bold text-gray-900">{c.name}</p>
                 <p className="text-sm text-blue-600 truncate">{c.address}</p>
             </div>
             {c.phone && <a href={`tel:${c.phone}`} className="p-3 bg-green-50 text-green-700 rounded-lg"><IconPhone /></a>}
          </div>

       </div>

       {/* 7. ACTION BAR */}
       {!isCompleted && !showKickback && !showInspection && (
           <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-xl z-30">
              <div className="max-w-lg mx-auto flex gap-3">
                 <button onClick={() => setShowKickback(true)} className="flex-1 bg-white text-red-600 border-2 border-red-100 py-3 rounded-xl font-bold text-sm">Reschedule</button>
                 {req.status === 'READY_TO_SCHEDULE' || req.status === 'SCHEDULED' ? (
                     <button onClick={() => updateStatus("IN_PROGRESS")} disabled={loading} className="flex-[2] bg-black text-white py-3 rounded-xl font-bold text-lg">▶ START JOB</button>
                 ) : isStarted ? (
                     <button onClick={() => updateStatus("COMPLETED")} disabled={loading} className="flex-[2] bg-green-600 text-white py-3 rounded-xl font-bold text-lg">✓ COMPLETE</button>
                 ) : (
                    <div className="flex-[2] flex items-center justify-center font-bold text-gray-400 bg-gray-100 rounded-xl">{req.status}</div>
                 )}
              </div>
           </div>
       )}

       {/* MODALS */}
       {/* 1. Kickback Modal */}
       {showKickback && (
           <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6 backdrop-blur-sm">
              <div className="bg-white w-full max-w-md rounded-2xl p-6">
                 <h3 className="font-bold text-lg text-red-600 mb-2">Return to Dispatch?</h3>
                 <textarea autoFocus className="w-full p-3 bg-gray-50 border rounded-lg mb-4" rows={3} placeholder="Reason (e.g. Wrong parts)..." value={kickbackReason} onChange={e => setKickbackReason(e.target.value)} />
                 <div className="flex gap-3">
                    <button onClick={() => setShowKickback(false)} className="flex-1 py-3 text-gray-600 font-bold">Cancel</button>
                    <button onClick={handleKickback} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-lg">Confirm</button>
                 </div>
              </div>
           </div>
       )}

       {/* 2. Inspection Modal */}
       {showInspection && (
           <div className="fixed inset-0 bg-gray-100 z-50 overflow-y-auto pb-20">
              <div className="bg-black text-white p-4 sticky top-0 flex justify-between items-center shadow-md">
                 <h2 className="font-bold text-lg">9-Point Inspection</h2>
                 <button onClick={() => setShowInspection(false)} className="text-sm text-gray-400">Close</button>
              </div>
              <div className="p-4 space-y-3 max-w-lg mx-auto">
                 {INSPECTION_POINTS.map((point) => (
                    <div key={point} className="bg-white p-4 rounded-xl shadow-sm flex items-center justify-between">
                       <span className="font-bold text-gray-900">{point}</span>
                       <div className="flex gap-2">
                          <button 
                            onClick={() => setInspectionData({...inspectionData, [point]: 'FAIL'})}
                            className={clsx("px-3 py-1 rounded text-xs font-bold border", inspectionData[point] === 'FAIL' ? "bg-red-600 text-white border-red-600" : "border-gray-200 text-gray-400")}
                          >FAIL</button>
                          <button 
                            onClick={() => setInspectionData({...inspectionData, [point]: 'PASS'})}
                            className={clsx("px-3 py-1 rounded text-xs font-bold border", inspectionData[point] === 'PASS' ? "bg-green-600 text-white border-green-600" : "border-gray-200 text-gray-400")}
                          >PASS</button>
                       </div>
                    </div>
                 ))}
                 <button onClick={() => setShowInspection(false)} className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg mt-6">Save Inspection</button>
              </div>
           </div>
       )}
    </div>
  );
}