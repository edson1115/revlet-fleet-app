"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

// --- ICONS ---
const IconPlus = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

const IconWrench = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const IconCheck = () => (
  <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const IconXCircle = () => (
  <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const IconCalendar = () => (
  <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

export default function CustomerDashboardClient({ requests = [], customerName }: { requests?: any[], customerName: string }) {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<"IDLE" | "SAVING" | "SUCCESS">("IDLE");
  const [needsPassword, setNeedsPassword] = useState(false);
  const [user, setUser] = useState<any>(null);

  const safeRequests = Array.isArray(requests) ? requests : [];

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const checkUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            setUser(session.user);
            if (session.user.user_metadata?.setup_complete !== true) {
                setNeedsPassword(true);
            }
        }
    };
    checkUser();
  }, [supabase.auth]); // Added dependency to be safe

  const handleSetPassword = async () => {
      setPasswordStatus("SAVING");
      const { error } = await supabase.auth.updateUser({ 
          password: newPassword,
          data: { setup_complete: true } 
      });

      if (error) {
          alert("Error setting password: " + error.message);
          setPasswordStatus("IDLE");
      } else {
          setPasswordStatus("SUCCESS");
          alert("✅ Password secured! You can now log in normally.");
          setNeedsPassword(false);
          router.refresh();
      }
  };
  
  // 1. Items requiring Immediate Customer Action
  const actionItems = safeRequests.filter(r => 
      r.status === 'PENDING' || 
      r.status === 'PROBLEM' || 
      r.status === 'WAITING_CONFIRMATION'
  );

  // 2. Define "Active" statuses for the Count Badge
  const activeStatuses = [
      'IN_PROGRESS', 'SCHEDULED', 'NEW', 'READY_TO_SCHEDULE', 
      'APPROVED_AND_SCHEDULING', 'RESCHEDULE_PENDING', 'WAITING_CONFIRMATION'
  ];
  
  const totalActiveCount = safeRequests.filter(r => activeStatuses.includes(r.status)).length;

  // 3. Main Feed: Active Jobs + Recent History (Last 72 Hours)
  const feedItems = safeRequests.filter(r => {
      if (activeStatuses.includes(r.status)) return true;
      const isTerminal = ['COMPLETED', 'BILLED', 'CANCELED', 'CANCELLED'].includes(r.status);
      if (isTerminal) {
          const threeDaysAgo = new Date();
          threeDaysAgo.setHours(threeDaysAgo.getHours() - 72);
          const recordDate = new Date(r.updated_at || r.created_at);
          return recordDate > threeDaysAgo;
      }
      return false;
  });

  // Sort feed: Most recently updated/created on top
  feedItems.sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime());

  return (
    // ✅ FIX: No <header> block here. The layout handles it.
    <div className="min-h-screen bg-[#F4F5F7] font-sans pb-20">
       <div className="space-y-8 px-6 py-10 max-w-7xl mx-auto">
           
           {/* PASSWORD BANNER */}
           {(needsPassword && passwordStatus !== "SUCCESS") && (
                <div className="bg-amber-50 border border-amber-200 p-6 rounded-[2rem] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm animate-in slide-in-from-top-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xl">⚠️</span>
                            <h2 className="text-sm font-black text-amber-900 uppercase italic tracking-tighter">Action Required: Set Password</h2>
                        </div>
                        <p className="text-amber-700 text-xs font-medium leading-relaxed max-w-lg">
                            You are logged in via a temporary invite. Set a password now to ensure you can access your account later.
                        </p>
                    </div>
                    <div className="flex w-full md:w-auto gap-2">
                        <input 
                            type="password" 
                            placeholder="New Password" 
                            className="p-3 rounded-xl border border-amber-200 outline-none text-sm font-bold w-full md:w-48 focus:ring-2 focus:ring-amber-500 bg-white"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                        <button 
                            onClick={handleSetPassword}
                            disabled={!newPassword || passwordStatus === "SAVING"}
                            className="bg-amber-600 text-white px-5 py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-amber-700 transition shadow-lg shadow-amber-600/20 whitespace-nowrap"
                        >
                            {passwordStatus === "SAVING" ? "Saving..." : "Save Password"}
                        </button>
                    </div>
                </div>
           )}

           {/* DASHBOARD HEADER & STATS */}
           <div className="space-y-6">
               <div className="flex justify-between items-end">
                  <div>
                    <h1 className="text-3xl font-black tracking-tight text-gray-900">{customerName}</h1>
                    <p className="text-gray-500 font-medium">Fleet Overview</p>
                  </div>
                  <div className="bg-zinc-900 px-4 py-2 rounded-xl text-white text-center">
                        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Active</div>
                        <div className="text-xl font-black">{totalActiveCount}</div>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <button onClick={() => router.push('/customer/requests/new')} className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm hover:shadow-md hover:border-black/20 transition text-left group">
                       <div className="bg-black text-white w-10 h-10 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition shadow-lg shadow-black/20">
                           <IconPlus />
                       </div>
                       <div className="font-bold text-zinc-900">Request Service</div>
                       <div className="text-xs text-zinc-500 mt-1">Report an issue</div>
                   </button>

                   <button onClick={() => router.push('/customer/tires')} className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm hover:shadow-md hover:border-black/20 transition text-left group">
                       <div className="bg-zinc-100 text-zinc-600 w-10 h-10 rounded-xl flex items-center justify-center mb-3 group-hover:bg-zinc-200 transition">
                           <IconWrench />
                       </div>
                       <div className="font-bold text-zinc-900">Order Tires</div>
                       <div className="text-xs text-zinc-500 mt-1">Browse catalog</div>
                   </button>
               </div>
           </div>

           {/* ACTION REQUIRED SECTION */}
           {actionItems.length > 0 && (
               <div className="space-y-4">
                   <h2 className="text-sm font-black text-red-600 uppercase tracking-widest flex items-center gap-2">
                      <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
                      Action Required ({actionItems.length})
                   </h2>
                   <div className="grid gap-4 md:grid-cols-2">
                      {actionItems.map(r => {
                          if (r.status === 'WAITING_CONFIRMATION') {
                              return (
                                <div key={r.id} onClick={() => router.push(`/customer/requests/${r.id}`)} className="bg-amber-50 p-5 rounded-2xl border border-amber-200 shadow-lg shadow-amber-900/5 hover:border-amber-400 transition cursor-pointer">
                                    <div className="flex items-start gap-3">
                                        <div className="text-2xl">⚠️</div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-black text-amber-900 text-sm uppercase tracking-wide">Confirm Appointment</h4>
                                                <div className="text-xs text-amber-800 font-bold">{r.vehicle?.plate}</div>
                                            </div>
                                            <div className="text-md font-bold text-zinc-900 mb-2">{r.service_title}</div>
                                            <p className="text-xs text-amber-800 mb-2 font-medium">Click to confirm time & keys.</p>
                                        </div>
                                    </div>
                                </div>
                              );
                          }
                          return null; 
                      })}
                   </div>
               </div>
           )}

           {/* MAIN FEED */}
           <div className="space-y-4">
               <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest">Recent Fleet Activity</h2>
               <div className="bg-white rounded-2xl border border-zinc-200 divide-y divide-zinc-100 shadow-sm">
                   {feedItems.length === 0 ? (
                       <div className="p-8 text-center text-gray-400 text-sm">No active maintenance in the last 72 hours.</div>
                   ) : (
                       feedItems.map(r => {
                           const notes = r.technician_notes || "";
                           const redCount = (notes.match(/🔴/g) || []).length;
                           const vehicleText = r.vehicle ? `${r.vehicle.year} ${r.vehicle.model}` : "Stock Order";
                           const isComplete = r.status === 'COMPLETED' || r.status === 'BILLED';
                           const isReschedule = r.status === 'RESCHEDULE_PENDING';
                           const isCanceled = r.status === 'CANCELED' || r.status === 'CANCELLED';

                           return (
                               <div key={r.id} onClick={() => router.push(`/customer/requests/${r.id}`)} className="p-5 flex justify-between items-center hover:bg-zinc-50 transition cursor-pointer">
                                   <div>
                                       <div className="font-bold text-gray-900 flex items-center gap-2">
                                            <span className={isCanceled ? "text-zinc-400 line-through decoration-zinc-400" : ""}>{vehicleText}</span>
                                            {redCount > 0 && !isCanceled && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title="Needs Attention"></span>}
                                            {isComplete && <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] font-black uppercase"><IconCheck /> Complete</span>}
                                            {isReschedule && <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-0.5 rounded-full text-[10px] font-black uppercase"><IconCalendar /> Reschedule Needed</span>}
                                            {isCanceled && <span className="flex items-center gap-1 text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full text-[10px] font-black uppercase border border-zinc-200"><IconXCircle /> Canceled</span>}
                                       </div>
                                       
                                       <div className="text-xs text-gray-500 mt-1 uppercase tracking-wide">
                                            {isCanceled ? (
                                                <span className="text-zinc-400 font-bold flex items-center gap-1">● Service Canceled</span>
                                            ) : r.status === 'IN_PROGRESS' ? (
                                                <span className="text-green-600 font-bold flex items-center gap-1">● In Repair</span>
                                            ) : r.status === 'NEW' ? (
                                                <span className="text-blue-600 font-bold flex items-center gap-1">● Requested (Pending Approval)</span>
                                            ) : (r.status === 'READY_TO_SCHEDULE' || r.status === 'APPROVED_AND_SCHEDULING') ? (
                                                <span className="text-emerald-600 font-bold flex items-center gap-1">● Approved & Scheduling</span>
                                            ) : isComplete ? (
                                                <span className="text-emerald-600 font-bold flex items-center gap-1">● Completed Recently</span>
                                            ) : isReschedule ? (
                                                <span className="text-red-600 font-bold flex items-center gap-1">● Reschedule Pending - Check Email</span>
                                            ) : (
                                                <span>Scheduled: {r.scheduled_start_at ? new Date(r.scheduled_start_at).toLocaleDateString() : "TBD"}</span>
                                            )}
                                       </div>
                                   </div>
                                   <div className="text-right">
                                       <div className="text-sm font-medium text-gray-900">{r.service_title}</div>
                                       <div className="text-xs text-gray-400">{r.technician?.full_name || "Unassigned"}</div>
                                   </div>
                               </div>
                           );
                       })
                   )}
               </div>
           </div>
       </div>
    </div>
  );
}