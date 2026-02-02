"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import clsx from "clsx";

export default function CustomerRequestClient({ request }: { request: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [keyLocation, setKeyLocation] = useState(""); 
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // --- FILTER IMAGES (The "Chain of Custody" Logic) ---
  const allImages = request.request_images || [];
  
  // 1. Customer's own photos (Always visible)
  const customerImages = allImages.filter((img: any) => 
      img.kind === 'customer_upload' || img.kind === 'damage' || !img.kind
  );

  // 2. Tech's photos (Before, After, etc.)
  const techImages = allImages.filter((img: any) => 
      ['before', 'after', 'other'].includes(img.kind)
  );

  // 3. Logic Gate: Only show Tech photos if the job is "Terminal" or "Rescheduled"
  // We don't want the customer seeing half-finished work while status is IN_PROGRESS.
  const showTechEvidence = ['COMPLETED', 'BILLED', 'RESCHEDULE_PENDING', 'CANCELED'].includes(request.status);


  // --- PARSE INSPECTION REPORT ---
  const notes = request.technician_notes || "";
  let inspectionItems: string[] = [];
  if (notes.includes("--- 9-POINT INSPECTION ---")) {
      const inspectionStart = notes.indexOf("--- 9-POINT INSPECTION ---");
      const reportBlock = notes.substring(inspectionStart);
      inspectionItems = reportBlock.split('\n').filter((line: string) => line.includes('🔴') || line.includes('🟡') || line.includes('🟢'));
  } else {
      inspectionItems = notes.split('\n').filter((line: string) => line.includes('🔴') || line.includes('🟡'));
  }
  const redItems = inspectionItems.filter(i => i.includes('🔴'));
  const yellowItems = inspectionItems.filter(i => i.includes('🟡'));


  // --- ACTIONS ---
  const handleApprove = async () => {
      if (!confirm("Submit this approval to the office?")) return;
      setLoading(true);
      
      const timestamp = new Date().toLocaleString();
      const approvalNote = `\n\n✅ CUSTOMER SUBMITTED APPROVAL\nTimestamp: ${timestamp}\nAction: Customer Approved Work`;

      const { error } = await supabase
        .from("service_requests")
        .update({ 
            status: 'APPROVED_AND_SCHEDULING', 
            technician_notes: (request.technician_notes || "") + approvalNote
        }) 
        .eq("id", request.id);

      if (!error) { router.push("/customer"); router.refresh(); }
      setLoading(false);
  };

  const handleDecline = async () => {
      const reason = prompt("Please provide a reason for declining (optional):");
      if (reason === null) return; 

      setLoading(true);
      const timestamp = new Date().toLocaleString();
      const declineNote = `\n\n❌ CUSTOMER DECLINED WORK\nTimestamp: ${timestamp}\nReason: ${reason || "No reason provided"}`;

      const { error } = await supabase
        .from("service_requests")
        .update({ 
            status: "CANCELED", 
            technician_notes: (request.technician_notes || "") + declineNote
        }) 
        .eq("id", request.id);

      if (!error) { router.push("/customer"); router.refresh(); }
      setLoading(false);
  };

  const handleConfirmAppointment = async () => {
      if (!keyLocation) return alert("Please tell us where the keys will be.");
      setLoading(true);

      // Simple update instead of API call for speed
      const { error } = await supabase
        .from("service_requests")
        .update({ 
            status: 'SCHEDULED', // Confirming moves it to SCHEDULED
            key_location: keyLocation
        })
        .eq("id", request.id);

      if (!error) {
          alert("Appointment Confirmed! See you then.");
          router.refresh();
      } else {
          alert("Error confirming appointment.");
      }
      setLoading(false);
  };

  return (
    <div className="space-y-6 pb-40 px-6 py-8 bg-[#F4F5F7] min-h-screen font-sans">
       
       {/* HEADER */}
       <button onClick={() => router.back()} className="text-xs font-bold text-gray-400 hover:text-black uppercase tracking-widest transition">← Back to Fleet</button>
       
       <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm">
           <div className="flex flex-col md:flex-row justify-between items-start gap-4">
               <div>
                   <h1 className="text-3xl font-black text-gray-900 mb-2">
                       {request.vehicle ? `${request.vehicle.year} ${request.vehicle.model}` : "Stock Order"}
                   </h1>
                   <div className="flex gap-2 items-center">
                       {request.vehicle && (
                           <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-lg text-xs font-mono font-bold">{request.vehicle.plate}</span>
                       )}
                       <span className={clsx(
                           "px-3 py-1 rounded-lg text-xs font-bold uppercase",
                           request.status === 'READY_TO_SCHEDULE' ? "bg-blue-50 text-blue-600" : 
                           request.status === 'WAITING_CONFIRMATION' ? "bg-amber-100 text-amber-700 animate-pulse" :
                           "bg-zinc-100 text-zinc-600"
                       )}>
                           {request.status.replace(/_/g, " ")}
                       </span>
                   </div>
               </div>
               <div className="text-left md:text-right">
                   <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Service</div>
                   <div className="text-lg font-bold text-gray-900">{request.service_title}</div>
               </div>
           </div>
       </div>

       {/* CONFIRMATION BOX */}
       {request.status === 'WAITING_CONFIRMATION' && (
           <div className="bg-amber-50 border border-amber-200 p-6 rounded-3xl shadow-lg shadow-amber-900/10 animate-in slide-in-from-top-4">
               <div className="flex items-start gap-4">
                   <div className="text-3xl">⚠️</div>
                   <div className="flex-1">
                       <h3 className="text-lg font-black text-amber-900 uppercase tracking-tight mb-2">Confirm Appointment</h3>
                       <p className="text-amber-800 text-sm mb-4">
                           Dispatch has requested: <br/>
                           <span className="font-bold text-lg">
                               {request.scheduled_start_at ? new Date(request.scheduled_start_at).toLocaleString() : "Time TBD"}
                           </span>
                       </p>
                       
                       <label className="text-[10px] font-bold text-amber-700 uppercase mb-1 block">Key Location</label>
                       <input 
                           value={keyLocation}
                           onChange={(e) => setKeyLocation(e.target.value)}
                           placeholder="e.g. Front Desk, Lockbox 1234..."
                           className="w-full p-3 rounded-xl border border-amber-300 mb-3 text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                       />
                       
                       <button 
                           onClick={handleConfirmAppointment}
                           disabled={loading}
                           className="w-full bg-black text-white py-3 rounded-xl font-bold uppercase text-xs tracking-widest shadow-lg hover:bg-zinc-800 transition"
                       >
                           {loading ? "Confirming..." : "Confirm & Lock Time"}
                       </button>
                   </div>
               </div>
           </div>
       )}

       {/* SERVICE DETAILS */}
       {(request.description || request.service_description) && (
           <div className="bg-zinc-900 rounded-2xl p-6 shadow-sm text-white">
               <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Service Details</h3>
               <div className="text-sm font-mono whitespace-pre-wrap leading-relaxed opacity-90">
                   {request.description || request.service_description}
               </div>
           </div>
       )}

       {/* INSPECTION REPORT */}
       {(redItems.length > 0 || yellowItems.length > 0) && (
           <div className="space-y-4 animate-in slide-in-from-bottom-4">
               {redItems.map((item, i) => (
                   <div key={i} className="bg-red-50 border border-red-100 p-5 rounded-2xl flex items-start gap-4 shadow-sm">
                       <div className="text-2xl pt-1">🔴</div>
                       <div>
                           <div className="font-bold text-red-900 text-lg">{item.replace("🔴 REQUIRED - ", "")}</div>
                           <p className="text-sm text-red-700 mt-1 font-medium">Requires immediate attention.</p>
                       </div>
                   </div>
               ))}
               {yellowItems.map((item, i) => (
                   <div key={i} className="bg-amber-50 border border-amber-100 p-5 rounded-2xl flex items-start gap-4 shadow-sm">
                       <div className="text-2xl pt-1">🟡</div>
                       <div>
                           <div className="font-bold text-amber-900 text-lg">{item.replace("🟡 RECOMMENDED - ", "")}</div>
                       </div>
                   </div>
               ))}
           </div>
       )}

       {/* --- IMAGE GALLERY (The Logic Gate) --- */}
       <div className="grid gap-6">
            {/* 1. Customer Uploads (Always Visible) */}
            {customerImages.length > 0 && (
                <div>
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 pl-2">Your Uploads</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {customerImages.map((img: any) => (
                            <div key={img.id} className="aspect-square rounded-2xl overflow-hidden bg-gray-100 border border-gray-200">
                                <img src={img.url_full} className="w-full h-full object-cover" />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 2. Tech Evidence (Visible ONLY when Completed/Rescheduled) */}
            {showTechEvidence && techImages.length > 0 && (
                <div className="animate-in fade-in duration-500">
                    <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-3 pl-2 flex items-center gap-2">
                        <span>📸</span> Technician Proof
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {techImages.map((img: any) => (
                            <div key={img.id} className="aspect-video rounded-2xl overflow-hidden bg-black border border-black relative group">
                                <img src={img.url_full} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition" />
                                <div className="absolute bottom-0 left-0 w-full bg-black/60 backdrop-blur-md p-2">
                                    <p className="text-[10px] font-bold text-white uppercase">{img.kind}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
       </div>

       {/* TECH NOTES */}
       <div className="bg-white rounded-2xl p-6 border border-gray-200">
           <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Technician Notes</h3>
           <div className="text-sm text-gray-600 whitespace-pre-wrap font-medium bg-gray-50 p-4 rounded-xl border border-gray-100">
                {request.technician_notes || "No additional notes."}
           </div>
       </div>

       {/* APPROVAL FOOTER */}
       {["NEW", "PENDING", "PROBLEM"].includes(request.status) && (
           <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-gray-200 p-4 z-50 shadow-[0_-5px_30px_rgba(0,0,0,0.08)]">
               <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                   <div className="text-center md:text-left">
                       <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</div>
                       <div className="text-lg font-black text-gray-900 flex items-center gap-2">
                            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span> Action Required
                       </div>
                   </div>
                   <div className="flex gap-3 w-full md:w-auto">
                       <button 
                           onClick={handleDecline} 
                           disabled={loading}
                           className="flex-1 md:flex-none px-6 py-4 rounded-xl border border-gray-200 font-bold text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition"
                       >
                           Decline
                       </button>
                       <button 
                           onClick={handleApprove} 
                           disabled={loading} 
                           className="flex-[2] md:flex-none px-8 py-4 rounded-xl bg-black text-white font-bold shadow-xl active:scale-95 transition"
                       >
                           {loading ? "Sending..." : "SUBMIT FOR REVIEW"}
                       </button>
                   </div>
               </div>
           </div>
       )}

       {/* STATUS BANNER */}
       {['READY_TO_SCHEDULE', 'APPROVED_AND_SCHEDULING'].includes(request.status) && (
           <div className="fixed bottom-0 left-0 w-full bg-emerald-50/90 backdrop-blur-md border-t border-emerald-100 p-6 z-50 text-center">
                <p className="text-emerald-800 font-bold uppercase text-sm flex justify-center items-center gap-2">
                    ✅ Approved. Dispatch is scheduling now.
                </p>
           </div>
       )}
    </div>
  );
}