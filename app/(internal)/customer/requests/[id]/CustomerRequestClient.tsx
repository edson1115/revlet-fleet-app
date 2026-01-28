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

  // --- 1. SUBMIT FOR REVIEW (Approve) ---
  const handleApprove = async () => {
      if (!confirm("Submit this approval to the office?")) return;
      setLoading(true);
      
      const timestamp = new Date().toLocaleString();
      const nextStatus = request.status === 'NEW' ? 'APPROVED_AND_SCHEDULING' : 'NEW'; 

      const approvalNote = `\n\n✅ CUSTOMER SUBMITTED APPROVAL\nTimestamp: ${timestamp}\nAction: Customer Approved Work`;

      const { error } = await supabase
        .from("service_requests")
        .update({ 
            status: nextStatus, 
            technician_notes: (request.technician_notes || "") + approvalNote
        }) 
        .eq("id", request.id);

      if (!error) {
          router.push("/customer"); 
          router.refresh(); 
      } else {
          console.error("Approve Error:", error);
          alert("Error sending request.");
          setLoading(false);
      }
  };

  // --- 2. DECLINE REQUEST (Revised) ---
  const handleDecline = async () => {
      const reason = prompt("Please provide a reason for declining (optional):");
      if (reason === null) return; 

      setLoading(true);
      const timestamp = new Date().toLocaleString();
      const declineNote = `\n\n❌ CUSTOMER DECLINED WORK\nTimestamp: ${timestamp}\nReason: ${reason || "No reason provided"}`;

      // ✅ FIX: Changed spelling to "CANCELED" (One 'L') to match common DB enums
      const { error } = await supabase
        .from("service_requests")
        .update({ 
            status: "CANCELED", 
            technician_notes: (request.technician_notes || "") + declineNote
        }) 
        .eq("id", request.id);

      if (!error) {
          alert("Request declined.");
          router.push("/customer"); 
          router.refresh(); 
      } else {
          console.error("Decline Error:", error);
          alert("Error declining request. (Check Console for Details)");
          setLoading(false);
      }
  };

  // --- 3. CONFIRM APPOINTMENT ---
  const handleConfirmAppointment = async () => {
      if (!keyLocation) return alert("Please tell us where the keys will be.");
      setLoading(true);

      const res = await fetch("/api/customer/confirm-appointment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ticket_id: request.id, key_location: keyLocation })
      });

      if (res.ok) {
          alert("Appointment Confirmed! See you then.");
          router.refresh();
      } else {
          alert("Error confirming appointment.");
      }
      setLoading(false);
  };

  return (
    <div className="space-y-6 pb-40 px-6 py-8">
       
       {/* HEADER */}
       <button onClick={() => router.back()} className="text-xs font-bold text-gray-400 hover:text-black uppercase tracking-widest transition">← Back to Fleet</button>
       
       <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-xl">
           <div className="flex justify-between items-start">
               <div>
                   <h1 className="text-3xl font-black text-gray-900 mb-2">
                       {request.vehicle ? `${request.vehicle.year} ${request.vehicle.model}` : "Stock Order / Drop Ship"}
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
                           {request.status.replace("_", " ")}
                       </span>
                   </div>
               </div>
               <div className="text-right">
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
                       <h3 className="text-lg font-black text-amber-900 uppercase tracking-tight mb-2">Appointment Proposed</h3>
                       <p className="text-amber-800 text-sm mb-4">
                           Dispatch has requested to service this vehicle on: <br/>
                           <span className="font-bold text-lg">
                               {request.scheduled_start_at ? new Date(request.scheduled_start_at).toLocaleString() : "Time TBD"}
                           </span>
                       </p>
                       
                       <label className="text-[10px] font-bold text-amber-700 uppercase mb-1 block">Where will the keys be?</label>
                       <input 
                           value={keyLocation}
                           onChange={(e) => setKeyLocation(e.target.value)}
                           placeholder="e.g. Front Desk, Lockbox 1234, Driver has them"
                           className="w-full p-3 rounded-xl border border-amber-300 mb-3 text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                       />
                       
                       <button 
                           onClick={handleConfirmAppointment}
                           disabled={loading}
                           className="w-full bg-black text-white py-3 rounded-xl font-bold uppercase text-xs tracking-widest shadow-lg hover:bg-zinc-800 transition"
                       >
                           {loading ? "Confirming..." : "Confirm Appointment"}
                       </button>
                   </div>
               </div>
           </div>
       )}

       {/* SERVICE DETAILS (OFFICE NOTES) */}
       {(request.description || request.service_description) && (
           <div className="bg-zinc-900 rounded-2xl p-6 shadow-sm text-white">
               <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Service Details & Recommendations</h3>
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

       {/* PHOTOS */}
       {request.request_images && request.request_images.length > 0 && (
           <div className="space-y-4">
               <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest pl-2">Visual Proof</h3>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   {request.request_images.map((img: any) => (
                       <div key={img.id} className="aspect-square rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 relative group cursor-pointer">
                           <img src={img.url_full} className="w-full h-full object-cover" />
                       </div>
                   ))}
               </div>
           </div>
       )}

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
                       {/* DECLINE BUTTON */}
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

       {/* PASSIVE STATUS BAR */}
       {(request.status === 'READY_TO_SCHEDULE' || request.status === 'APPROVED_AND_SCHEDULING') && (
           <div className="fixed bottom-0 left-0 w-full bg-emerald-50/90 backdrop-blur-md border-t border-emerald-100 p-6 z-50 text-center">
                <p className="text-emerald-800 font-bold uppercase text-sm flex justify-center items-center gap-2">
                    ✅ Approved. Dispatch is scheduling now.
                </p>
           </div>
       )}
    </div>
  );
}