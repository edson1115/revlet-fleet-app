"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { createBrowserClient } from "@supabase/ssr";

// --- ICONS ---
const IconClock = () => <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const IconLogout = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
const IconBox = () => <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>;

export default function TechDashboardClient({ requests }: { requests: any[] }) {
  const router = useRouter();
  const [view, setView] = useState<"TODAY" | "UPCOMING">("TODAY");

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 1. Logic (Unchanged from your version)
  const { todayJobs, upcomingJobs } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const _today: any[] = [];
    const _upcoming: any[] = [];

    requests.forEach(r => {
      if (r.status === 'IN_PROGRESS') {
        _today.push(r);
        return;
      }
      if (!r.scheduled_start_at) {
        _upcoming.push(r);
        return;
      }
      const jobDate = new Date(r.scheduled_start_at);
      jobDate.setHours(0, 0, 0, 0);
      if (jobDate.getTime() === today.getTime() || jobDate.getTime() < today.getTime()) {
        _today.push(r);
      } else {
        _upcoming.push(r);
      }
    });
    return { todayJobs: _today, upcomingJobs: _upcoming };
  }, [requests]);

  const displayedJobs = view === "TODAY" ? todayJobs : upcomingJobs;

  const loadoutCount = useMemo(() => {
    return displayedJobs.reduce((acc, job) => acc + (job.request_parts?.length || 0), 0);
  }, [displayedJobs]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans pb-24">
      
      {/* MOBILE HEADER */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-6 py-6 sticky top-0 z-30 flex justify-between items-center shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <div className="bg-white text-black text-[10px] font-black px-1.5 py-0.5 rounded italic">REVLET</div>
             <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Technician</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">
            {view === "TODAY" ? `${todayJobs.length} Jobs Today` : `${upcomingJobs.length} Upcoming`}
          </h1>
        </div>
        <button onClick={handleLogout} className="p-2 text-zinc-500 hover:text-white transition active:scale-90">
          <IconLogout />
        </button>
      </div>

      {/* VIEW TOGGLE */}
      <div className="p-4 sticky top-[88px] z-20 bg-black/80 backdrop-blur-md">
        <div className="bg-zinc-900 p-1 rounded-2xl flex gap-1 border border-zinc-800 shadow-xl">
          <button 
            onClick={() => setView("TODAY")}
            className={clsx(
              "flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all",
              view === "TODAY" ? "bg-white text-black shadow-lg" : "text-zinc-500"
            )}
          >
            Today
          </button>
          <button 
            onClick={() => setView("UPCOMING")}
            className={clsx(
              "flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all",
              view === "UPCOMING" ? "bg-white text-black shadow-lg" : "text-zinc-500"
            )}
          >
            Upcoming
          </button>
        </div>
      </div>

      {/* DAILY LOADOUT BANNER */}
      {displayedJobs.length > 0 && loadoutCount > 0 && (
        <div className="px-4 mb-6">
          <div className="bg-amber-400 rounded-2xl p-5 flex justify-between items-center active:scale-[0.98] transition shadow-lg shadow-amber-900/20">
            <div className="flex items-center gap-4">
              <div className="bg-black/10 p-2.5 rounded-xl">
                <IconBox />
              </div>
              <div>
                <div className="font-black text-black text-sm uppercase tracking-wider leading-none">
                  {view === "TODAY" ? "Daily Loadout" : "Future Parts Prep"}
                </div>
                <div className="text-[11px] font-bold text-black/60 mt-1">
                  {loadoutCount} Items to grab for this list
                </div>
              </div>
            </div>
            <div className="bg-black/80 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase">
              View &rarr;
            </div>
          </div>
        </div>
      )}

      {/* JOB LIST */}
      <div className="px-4 space-y-4">
        {displayedJobs.length === 0 ? (
           <div className="text-center py-20 bg-zinc-900/30 rounded-3xl border border-dashed border-zinc-800">
              <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Bay is Clear</p>
              <p className="text-zinc-700 text-sm mt-2">Check Upcoming for more work.</p>
           </div>
        ) : (
          displayedJobs.map((r) => (
            <div 
              key={r.id}
              onClick={() => router.push(`/tech/requests/${r.id}`)}
              className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 active:scale-[0.98] transition relative overflow-hidden group shadow-sm"
            >
              {/* Left Status Strip */}
              <div className={clsx(
                "absolute left-0 top-0 bottom-0 w-1.5",
                r.status === 'IN_PROGRESS' ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" : "bg-blue-600"
              )} />

              <div className="flex justify-between items-start mb-3 pl-2">
                 <h3 className="font-black text-xl text-white tracking-tight truncate pr-2">
                    {r.customer?.name}
                 </h3>
                 
                 {r.scheduled_start_at && (
                    <div className="text-[9px] font-black bg-zinc-800 text-zinc-400 px-2 py-1 rounded-lg uppercase tracking-wider flex items-center gap-1">
                       <IconClock />
                       {new Date(r.scheduled_start_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                 )}
              </div>

              <div className="pl-2 mb-4 flex items-center gap-3">
                 <div className="bg-white text-black px-3 py-1 rounded-lg text-sm font-mono font-black shadow-md">
                    {r.plate || r.vehicle?.plate || "NO PLATE"}
                 </div>
                 <div className="text-sm font-bold text-zinc-400">
                    {r.vehicle?.year} {r.vehicle?.model}
                 </div>
              </div>

              <div className="pl-2 pt-4 border-t border-zinc-800/50 flex justify-between items-center">
                 <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest truncate max-w-[70%]">
                    {r.service_title}
                 </div>
                 
                 {r.status === 'IN_PROGRESS' && (
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </span>
                      <span className="text-[10px] font-black text-green-500 uppercase tracking-tighter">Live</span>
                    </div>
                 )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}