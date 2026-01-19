"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import clsx from "clsx";

export default function CustomerRequestClient({ request }: { request: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // --- PARSE INSPECTION REPORT ---
  const notes = request.technician_notes || "";
  const inspectionStart = notes.indexOf("--- 9-POINT INSPECTION ---");
  
  let inspectionItems: string[] = [];
  if (inspectionStart !== -1) {
      const reportBlock = notes.substring(inspectionStart);
      inspectionItems = reportBlock.split('\n').filter((line: string) => line.includes('🔴') || line.includes('🟡') || line.includes('🟢'));
  }

  const redItems = inspectionItems.filter(i => i.includes('🔴'));
  const yellowItems = inspectionItems.filter(i => i.includes('🟡'));

  // --- ACTIONS ---
  const handleApprove = async () => {
      if (!confirm("Submit this approval to the office?")) return;
      setLoading(true);
      
      const timestamp = new Date().toLocaleString();
      const approvalNote = `\n\n✅ CUSTOMER SUBMITTED APPROVAL\nTimestamp: ${timestamp}\nAction: Queued for Dispatch Review`;

      const { error } = await supabase
        .from("service_requests")
        .update({ 
            status: "NEW", 
            technician_notes: request.technician_notes + approvalNote
        }) 
        .eq("id", request.id);

      if (!error) {
          router.push("/customer"); 
          router.refresh(); 
      } else {
          alert("Error sending request.");
          setLoading(false);
      }
  };

  return (
    <div className="space-y-6 pb-40 px-6 py-8">
       
       {/* HEADER */}
       <button onClick={() => router.back()} className="text-xs font-bold text-gray-400 hover:text-black uppercase tracking-widest transition">← Back to Fleet</button>
       
       <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-xl">
           <div className="flex justify-between items-start">
               <div>
                   {/* Handle "Stock Order" Title Correctly */}
                   <h1 className="text-3xl font-black text-gray-900 mb-2">
                       {request.vehicle ? `${request.vehicle.year} ${request.vehicle.model}` : "Stock Order / Drop Ship"}
                   </h1>
                   <div className="flex gap-2 items-center">
                       {request.vehicle && (
                           <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-lg text-xs font-mono font-bold">{request.vehicle.plate}</span>
                       )}
                       <span className={clsx(
                           "px-3 py-1 rounded-lg text-xs font-bold uppercase",
                           request.status === 'READY_TO_SCHEDULE' ? "bg-red-100 text-red-600 animate-pulse" : "bg-blue-50 text-blue-600"
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

       {/* ✅ NEW: ORDER DETAILS (PO, Size, Brand) */}
       {request.description && (
           <div className="bg-zinc-900 rounded-2xl p-6 shadow-sm text-white">
               <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Order Specification</h3>
               <div className="text-sm font-mono whitespace-pre-wrap leading-relaxed opacity-90">
                   {request.description}
               </div>
           </div>
       )}

       {/* 🚦 INSPECTION REPORT (Existing Logic) */}
       {(redItems.length > 0 || yellowItems.length > 0) && (
           <div className="space-y-4 animate-in slide-in-from-bottom-4">
               {/* ... (Keep existing Red/Yellow mapping code) ... */}
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

       {/* ACTION BAR (Existing Logic) */}
       {request.status === 'READY_TO_SCHEDULE' && (
           <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-gray-200 p-4 z-50 shadow-[0_-5px_30px_rgba(0,0,0,0.08)]">
               <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                   <div className="text-center md:text-left">
                       <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</div>
                       <div className="text-lg font-black text-gray-900 flex items-center gap-2">
                            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span> Action Required
                       </div>
                   </div>
                   <div className="flex gap-3 w-full md:w-auto">
                       <button className="flex-1 md:flex-none px-6 py-4 rounded-xl border border-gray-200 font-bold text-gray-500 hover:bg-gray-50">Decline</button>
                       <button onClick={handleApprove} disabled={loading} className="flex-[2] md:flex-none px-8 py-4 rounded-xl bg-black text-white font-bold shadow-xl">
                           {loading ? "Sending..." : "SUBMIT FOR REVIEW"}
                       </button>
                   </div>
               </div>
           </div>
       )}
    </div>
  );
}