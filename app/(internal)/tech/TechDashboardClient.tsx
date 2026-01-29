"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { createBrowserClient } from "@supabase/ssr";
import PlayerCard from "@/components/gamification/PlayerCard"; 
import XpToast from "@/components/gamification/XpToast";
import XpHistoryModal from "@/components/gamification/XpHistoryModal";
import TrophyModal from "@/components/gamification/TrophyModal";
import PerksModal from "@/components/gamification/PerksModal"; // ✅ IMPORTED

// --- ICONS ---
const IconRefresh = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;
const IconLogout = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
const IconBox = () => <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>;
const IconClock = () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const IconX = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const IconMapPin = () => <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const IconTrophy = () => <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>;
// ✅ NEW ICON
const IconStar = () => <svg className="w-5 h-5 text-indigo-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>;

export default function TechDashboardClient({ 
  requests, 
  userId, 
  userName, 
  currentXp = 0 
}: { 
  requests: any[], 
  userId: string, 
  userName: string, 
  currentXp?: number 
}) {
  const router = useRouter();
  const [view, setView] = useState<"TODAY" | "UPCOMING">("TODAY");
  const [showLoadout, setShowLoadout] = useState(false); 
  const [showHistory, setShowHistory] = useState(false);
  const [showTrophies, setShowTrophies] = useState(false);
  const [showPerks, setShowPerks] = useState(false); // ✅ NEW STATE
  const [allJobs] = useState<any[]>(requests || []);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [shiftStart, setShiftStart] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchShift = async () => {
        const { data } = await supabase.from('profiles').select('current_shift_start').eq('id', userId).single();
        if (data?.current_shift_start) setShiftStart(data.current_shift_start);
    };
    if (userId) fetchShift();
  }, [userId, supabase]);

  async function refreshData() {
    setIsRefreshing(true);
    router.refresh(); 
    if (userId) {
        const { data } = await supabase.from('profiles').select('current_shift_start').eq('id', userId).single();
        if (data?.current_shift_start) setShiftStart(data.current_shift_start);
    }
    setIsRefreshing(false);
  }

  const { todayJobs, upcomingJobs } = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const _today: any[] = [];
    const _upcoming: any[] = [];

    (allJobs || []).forEach(r => {
      if (r.status === 'IN_PROGRESS' || r.status === 'RESCHEDULE_PENDING') {
        _today.push(r); return;
      }
      if (!r.scheduled_start_at) {
        _upcoming.push(r); return;
      }
      const jobDate = new Date(r.scheduled_start_at);
      jobDate.setHours(0, 0, 0, 0);
      if (jobDate.getTime() <= today.getTime()) _today.push(r);
      else _upcoming.push(r);
    });
    return { todayJobs: _today, upcomingJobs: _upcoming };
  }, [allJobs]);

  const displayedJobs = view === "TODAY" ? todayJobs : upcomingJobs;

  const dailyParts = useMemo(() => {
      const totals: Record<string, { name: string, qty: number, number: string }> = {};
      todayJobs.forEach(job => {
          if(job.request_parts) {
              job.request_parts.forEach((p: any) => {
                  const key = p.part_number || p.part_name;
                  if(!totals[key]) totals[key] = { name: p.part_name, number: p.part_number, qty: 0 };
                  totals[key].qty += p.quantity;
              });
          }
      });
      return Object.values(totals);
  }, [todayJobs]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans pb-32">
      
      {/* Toast Notification */}
      <XpToast userId={userId} />

      {/* HEADER */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-5 py-5 sticky top-0 z-30 flex justify-between items-center shadow-2xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <div className="bg-white text-black text-[10px] font-black px-1.5 py-0.5 rounded italic tracking-tighter">REVLET</div>
             <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Tech App</span>
          </div>
          <h1 className="text-xl font-black tracking-tight text-white">{userName}</h1>
        </div>
        <div className="flex items-center gap-2">
            <button onClick={refreshData} disabled={isRefreshing} className={clsx("p-3 rounded-full bg-zinc-800 text-zinc-400 hover:text-white", isRefreshing && "animate-spin text-white")}>
                <IconRefresh />
            </button>
            <button onClick={handleLogout} className="p-3 rounded-full bg-zinc-800 text-zinc-400 hover:text-red-400"><IconLogout /></button>
        </div>
      </div>

      {/* VIEW TOGGLE & PLAYER CARD */}
      <div className="p-4 sticky top-[80px] z-20 bg-black/90 backdrop-blur-xl">
        
        {/* CLICKABLE PLAYER CARD (Opens History) */}
        <div onClick={() => setShowHistory(true)} className="cursor-pointer active:scale-[0.98] transition hover:opacity-90">
            <PlayerCard xp={currentXp} name={userName} />
        </div>

        {/* ✅ ACTION BAR: VIEW TOGGLE + PERKS + TROPHY */}
        <div className="flex gap-2 mt-4">
            {/* View Toggle */}
            <div className="bg-zinc-900 p-1 rounded-xl flex gap-1 border border-zinc-800 shadow-lg flex-1">
                <button onClick={() => setView("TODAY")} className={clsx("flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-lg transition-all", view === "TODAY" ? "bg-white text-black shadow-lg" : "text-zinc-500")}>Today ({todayJobs.length})</button>
                <button onClick={() => setView("UPCOMING")} className={clsx("flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-lg transition-all", view === "UPCOMING" ? "bg-white text-black shadow-lg" : "text-zinc-500")}>Upcoming ({upcomingJobs.length})</button>
            </div>

            {/* Perks Button */}
            <button 
                onClick={() => setShowPerks(true)}
                className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 flex items-center justify-center shadow-lg active:scale-95 transition"
            >
                <IconStar />
            </button>

            {/* Trophy Button */}
            <button 
                onClick={() => setShowTrophies(true)}
                className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 flex items-center justify-center shadow-lg active:scale-95 transition"
            >
                <IconTrophy />
            </button>
        </div>
      </div>

      {/* SHIFT START BANNER */}
      {shiftStart && view === "TODAY" && (
          <div className="mx-4 mb-4 bg-indigo-600 rounded-2xl p-5 shadow-lg shadow-indigo-900/20 border border-indigo-500 flex items-center justify-between">
              <div className="flex items-center gap-4">
                  <div className="p-2 bg-indigo-800/50 rounded-xl text-white"><IconClock /></div>
                  <div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Shift Start Time</div>
                      <div className="text-2xl font-black text-white">{shiftStart}</div>
                  </div>
              </div>
          </div>
      )}

      {/* DAILY LOADOUT BUTTON */}
      {dailyParts.length > 0 && view === "TODAY" && (
        <div className="px-4 mb-4">
          <button 
            onClick={() => setShowLoadout(true)}
            className="w-full bg-amber-400 border-amber-300 rounded-2xl p-4 flex justify-between items-center active:scale-[0.98] transition shadow-lg border text-black"
          >
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-black/10 text-black"><IconBox /></div>
              <div className="text-left">
                <div className="font-black text-xs uppercase tracking-wider leading-none">Daily Loadout List</div>
                <div className="text-[11px] font-bold opacity-70 mt-1">{dailyParts.length} distinct items to load</div>
              </div>
            </div>
            <div className="bg-black/90 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase">View List</div>
          </button>
        </div>
      )}

      {/* JOB LIST */}
      <div className="px-4 space-y-4">
        {displayedJobs.length === 0 ? (
           <div className="text-center py-24 px-10 bg-zinc-900/30 rounded-3xl border-2 border-dashed border-zinc-800">
              <p className="text-zinc-500 font-black uppercase tracking-widest text-xs mb-2">No Jobs Found</p>
              <p className="text-zinc-600 text-sm font-medium">You are all caught up!</p>
           </div>
        ) : (
          displayedJobs.map((r) => {
            const isLive = r.status === 'IN_PROGRESS';
            const isRescheduled = r.status === 'RESCHEDULE_PENDING';
            const hasParts = r.request_parts && r.request_parts.length > 0;
            const timeString = r.scheduled_start_at ? new Date(r.scheduled_start_at).toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'}) : "TBD";
            const address = r.customer?.address || "Address not provided";

            return (
                <div 
                  key={r.id}
                  onClick={() => router.push(`/tech/jobs/${r.id}`)}
                  className={clsx(
                      "rounded-3xl p-5 border active:scale-[0.97] transition relative overflow-hidden shadow-lg cursor-pointer",
                      isLive ? "bg-zinc-800 border-green-500/50 shadow-green-900/10" : 
                      isRescheduled ? "bg-zinc-800 border-red-500/50" :
                      "bg-zinc-900 border-zinc-800"
                  )}
                >
                  <div className={clsx("absolute left-0 top-0 bottom-0 w-1.5", isLive ? "bg-green-500" : isRescheduled ? "bg-red-500" : "bg-blue-600")} />

                  <div className="flex justify-between items-start mb-3 pl-3">
                      <div className="flex items-center gap-2">
                          <div className={clsx("text-xs font-black px-2 py-1 rounded border", 
                              isLive ? "bg-green-500 text-black border-green-500" : 
                              isRescheduled ? "bg-red-500 text-white border-red-500" : 
                              "bg-black text-white border-zinc-700"
                          )}>
                              {isLive ? "ACTIVE NOW" : isRescheduled ? "NEEDS RESCHEDULE" : timeString}
                          </div>
                          {hasParts && <div className="text-[10px] font-bold bg-amber-400 text-black px-2 py-1 rounded flex items-center gap-1"><IconBox /> Parts</div>}
                      </div>
                  </div>

                  <div className="pl-3 mb-2">
                      <div className="text-2xl font-black text-white tracking-tight leading-none truncate pr-2">{r.customer?.name}</div>
                      <div className="flex items-start gap-1 mt-1 text-zinc-400 text-xs font-bold">
                          <IconMapPin />
                          <span className="truncate">{address}</span>
                      </div>
                  </div>

                  <div className="pl-3 flex flex-col gap-1">
                      <div className="text-sm font-bold text-zinc-300">
                        {r.vehicle?.year} {r.vehicle?.model} 
                        <span className="ml-2 bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded text-[10px] font-mono border border-zinc-700">{r.vehicle?.plate}</span>
                      </div>
                      <div className="text-xs font-medium text-zinc-500 uppercase tracking-wide truncate mt-1">{r.service_title}</div>
                  </div>
                </div>
            );
          })
        )}
      </div>

      {/* LOADOUT MODAL */}
      {showLoadout && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm p-6 flex flex-col animate-in fade-in">
              <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Daily Loadout</h2>
                  <button onClick={() => setShowLoadout(false)} className="p-2 bg-zinc-800 rounded-full text-zinc-400"><IconX /></button>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-3">
                  {dailyParts.map((part, i) => (
                      <div key={i} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex justify-between items-center">
                          <div>
                              <div className="font-bold text-white text-lg">{part.name}</div>
                              <div className="text-xs text-zinc-500 font-mono">{part.number}</div>
                          </div>
                          <div className="bg-amber-400 text-black font-black text-xl px-4 py-2 rounded-lg">x{part.qty}</div>
                      </div>
                  ))}
              </div>
              <button onClick={() => setShowLoadout(false)} className="mt-4 w-full bg-white text-black font-black uppercase py-4 rounded-xl">Done Loading</button>
          </div>
      )}

      {/* HISTORY MODAL */}
      {showHistory && (
          <XpHistoryModal userId={userId} onClose={() => setShowHistory(false)} />
      )}

      {/* TROPHY MODAL */}
      {showTrophies && (
          <TrophyModal userId={userId} onClose={() => setShowTrophies(false)} />
      )}

      {/* ✅ PERKS MODAL */}
      {showPerks && (
          <PerksModal currentXp={currentXp} onClose={() => setShowPerks(false)} />
      )}
    </div>
  );
}