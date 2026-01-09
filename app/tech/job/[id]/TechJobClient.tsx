"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { TechPartsList } from "@/components/tech/TechPartsList"; // 👈 IMPORT THIS

// --- ICONS ---
const IconBack = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>;
const IconCamera = () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const IconCheck = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>;
const IconX = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const IconTrash = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const IconClock = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

// --- INSPECTION CONFIG ---
const INSPECTION_POINTS = [
  "Tires & Pressure", "Brakes & Rotors", "Fluid Levels", "Lights & Signals",
  "Wipers & Glass", "Belts & Hoses", "Battery Health", "Undercarriage", "Test Drive"
];

export default function TechJobClient({ request }: { request: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // --- WORKFLOW STATE ---
  const [techNotes, setTechNotes] = useState("");
  const [inspectionData, setInspectionData] = useState<Record<string, "PASS" | "FAIL" | null>>({});
  
  // --- PHOTO STATE ---
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Snapshot Logic
  const displayPlate = request.plate || request.vehicle?.plate || "NO PLATE";

  // Date Logic
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const jobDate = request.scheduled_start_at ? new Date(request.scheduled_start_at) : null;
  if (jobDate) jobDate.setHours(0, 0, 0, 0);
  const isFuture = jobDate && jobDate.getTime() > today.getTime();

  // --- HELPER: Format Inspection Data into Text ---
  function formatReport(notes: string, inspection: any) {
    let report = "";
    if (notes) report += `NOTES:\n${notes}\n\n`;

    const keys = Object.keys(inspection);
    if (keys.length > 0) {
        report += "9-POINT INSPECTION:\n";
        keys.forEach(k => {
            report += `- ${k}: ${inspection[k]}\n`;
        });
    }
    return report;
  }

  async function updateStatus(newStatus: string) {
    let finalNotes = techNotes; 

    // 🛑 SCENARIO 1: RESCHEDULE (Needs a Reason)
    if (newStatus === "READY_TO_SCHEDULE") {
        const reason = prompt("Please enter the reason for rescheduling (Required):");
        if (!reason) return; // Cancel if no reason
        finalNotes = `RESCHEDULE REASON: ${reason}`;
    }

    // ✅ SCENARIO 2: COMPLETE (Needs Inspection Data)
    if (newStatus === "COMPLETED") {
        if(!confirm("Finish job and submit inspection report?")) return;
        finalNotes = formatReport(techNotes, inspectionData);
    }

    setLoading(true);
    
    await fetch(`/api/tech/update-status`, {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify({ 
         id: request.id, 
         status: newStatus,
         notes: finalNotes 
       })
    });
    
    if (newStatus === "READY_TO_SCHEDULE") {
        router.push("/tech");
    } else {
        router.refresh();
        setLoading(false);
    }
  }

  // --- INSPECTION HELPER ---
  const togglePoint = (point: string, status: "PASS" | "FAIL") => {
    setInspectionData(prev => ({
        ...prev,
        [point]: prev[point] === status ? null : status
    }));
  };

  // --- PHOTO HELPERS ---
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const previewUrl = URL.createObjectURL(file);
      setPhotoPreviews(prev => [...prev, previewUrl]);
    }
  };

  const removePhoto = (indexToRemove: number) => {
    setPhotoPreviews(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-32 font-sans">
      
      {/* HEADER */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center gap-4 shadow-sm">
         <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-gray-100 transition">
            <IconBack />
         </button>
         <div className="flex-1 overflow-hidden">
            <div className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                {request.status === 'IN_PROGRESS' ? 'Active Worksheet' : 'Job Details'}
            </div>
            <div className="font-bold text-gray-900 leading-none truncate">{request.vehicle?.year} {request.vehicle?.model}</div>
         </div>
         <span className={clsx(
            "px-2 py-1 rounded text-[10px] font-black uppercase tracking-wide",
            request.status === 'IN_PROGRESS' ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
         )}>
            {request.status.replace(/_/g, " ")}
         </span>
      </div>

      <div className="p-4 space-y-6 max-w-lg mx-auto">
         
         {/* === SECTION 1: JOB INFO === */}
         <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
            <div className="flex gap-3 mb-4 flex-wrap">
               <div className="bg-black text-white px-3 py-1.5 rounded-lg border shadow-sm font-mono font-bold text-lg">
                  {displayPlate}
               </div>
               {request.vehicle?.unit_number && (
                  <div className="bg-gray-100 text-gray-800 border border-gray-200 px-3 py-1.5 rounded-lg font-bold flex items-center">
                      #{request.vehicle.unit_number}
                  </div>
               )}
            </div>
            <h2 className="text-xl font-black text-gray-900 leading-tight mb-2">
               {request.service_title}
            </h2>
            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
               {request.service_description || "No specific instructions provided."}
            </div>
         </div>

         {/* === SECTION 2: WORKSHEET === */}
         {request.status === 'IN_PROGRESS' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                
                {/* 9-POINT INSPECTION */}
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="bg-gray-900 text-white px-5 py-3 flex justify-between items-center">
                        <h3 className="font-bold text-sm uppercase tracking-wide">9-Point Inspection</h3>
                        <span className="text-xs bg-white/20 px-2 py-0.5 rounded font-bold">Required</span>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {INSPECTION_POINTS.map((point) => (
                            <div key={point} className="p-4 flex items-center justify-between">
                                <span className="font-bold text-gray-700 text-sm">{point}</span>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => togglePoint(point, "PASS")}
                                        className={clsx(
                                            "w-10 h-10 rounded-full flex items-center justify-center transition border",
                                            inspectionData[point] === 'PASS' 
                                                ? "bg-green-500 text-white border-green-600 shadow-inner" 
                                                : "bg-gray-50 text-gray-300 border-gray-200 hover:bg-gray-100"
                                        )}
                                    >
                                        <IconCheck />
                                    </button>
                                    <button 
                                        onClick={() => togglePoint(point, "FAIL")}
                                        className={clsx(
                                            "w-10 h-10 rounded-full flex items-center justify-center transition border",
                                            inspectionData[point] === 'FAIL' 
                                                ? "bg-red-500 text-white border-red-600 shadow-inner" 
                                                : "bg-gray-50 text-gray-300 border-gray-200 hover:bg-gray-100"
                                        )}
                                    >
                                        <IconX />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* PHOTOS (ACTIVE) */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                    <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide mb-4">Job Photos</h3>
                    
                    <input 
                      type="file" 
                      accept="image/*" 
                      capture="environment" 
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handlePhotoSelect}
                    />

                    <div className="grid grid-cols-3 gap-3">
                        {photoPreviews.map((src, idx) => (
                           <div key={idx} className="aspect-square relative rounded-xl overflow-hidden border border-gray-200 group">
                              <img src={src} alt="Job Preview" className="w-full h-full object-cover" />
                              <button 
                                onClick={() => removePhoto(idx)}
                                className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full hover:bg-red-500 transition"
                              >
                                <IconTrash />
                              </button>
                           </div>
                        ))}

                        <div 
                          onClick={() => fileInputRef.current?.click()}
                          className="aspect-square bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:bg-white hover:border-black transition active:scale-95"
                        >
                            <IconCamera />
                            <span className="text-[10px] font-bold mt-1">Add Photo</span>
                        </div>
                    </div>
                </div>

                {/* TECH NOTES */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                    <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide mb-2">Tech Recommendations</h3>
                    <textarea 
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black min-h-[120px]"
                        placeholder="Note any issues found, parts used, or recommendations for the customer..."
                        value={techNotes}
                        onChange={(e) => setTechNotes(e.target.value)}
                    />
                </div>

            </div>
         )}

         {/* === SECTION 3: PARTS LIST (NEW COMPONENT) === */}
         <div>
            <h3 className="text-xs font-black uppercase text-gray-400 tracking-wider mb-2 px-2">Parts Required</h3>
            {/* 👇 THIS IS THE NEW LIVE COMPONENT 👇 */}
            <TechPartsList requestId={request.id} />
         </div>

      </div>

      {/* ACTION BAR */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 pb-8 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-30">
         {request.status === 'SCHEDULED' && (
            <div className="flex gap-3">
               {/* 🛑 RESCHEDULE BUTTON */}
               <button 
                  onClick={() => updateStatus("READY_TO_SCHEDULE")}
                  disabled={loading}
                  className="w-1/3 bg-gray-100 text-gray-500 font-bold text-lg py-4 rounded-xl hover:bg-gray-200 active:scale-95 transition flex flex-col items-center justify-center leading-none gap-1"
               >
                  <IconClock />
                  <span className="text-[10px] uppercase tracking-wide">Reschedule</span>
               </button>

               {/* START JOB BUTTON */}
               <button 
                  onClick={() => updateStatus("IN_PROGRESS")}
                  disabled={loading || isFuture}
                  className={clsx(
                     "flex-1 font-black text-lg py-4 rounded-xl shadow-xl transition disabled:opacity-100", 
                     isFuture 
                       ? "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none" 
                       : "bg-black text-white hover:bg-gray-800 active:scale-95"
                  )}
               >
                  {loading 
                     ? "Starting..." 
                     : isFuture 
                        ? "Scheduled for Later" 
                        : "START WORK"
                  }
               </button>
            </div>
         )}

         {request.status === 'IN_PROGRESS' && (
            <button 
               onClick={() => updateStatus("COMPLETED")}
               disabled={loading}
               className="w-full bg-green-600 text-white font-black text-lg py-4 rounded-xl shadow-xl hover:bg-green-700 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center leading-none gap-1"
            >
               <span>COMPLETE JOB</span>
               <span className="text-[10px] opacity-80 font-normal uppercase tracking-wide">Submit Inspection & Notes</span>
            </button>
         )}

         {request.status === 'COMPLETED' && (
            <div className="w-full bg-gray-100 text-gray-400 font-bold text-center py-4 rounded-xl">
               Job Completed
            </div>
         )}
      </div>
    </div>
  );
}