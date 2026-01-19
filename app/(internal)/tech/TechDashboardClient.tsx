"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { createBrowserClient } from "@supabase/ssr";

// --- ICONS ---
const IconRefresh = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;
const IconLogout = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
const IconBox = () => <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>;
const IconClock = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const IconX = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;

export default function TechDashboardClient({ requests, userId, userName }: { requests: any[], userId: string, userName: string }) {
  const router = useRouter();
  const [view, setView] = useState<"TODAY" | "UPCOMING">("TODAY");
  const [showPartsOnly, setShowPartsOnly] = useState(false);
  const [allJobs] = useState<any[]>(requests || []);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function refreshData() {
    setIsRefreshing(true);
    router.refresh(); 
    setIsRefreshing(false);
  }

  const { todayJobs, upcomingJobs } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const _today: any[] = [];
    const _upcoming: any[] = [];

    (allJobs || []).forEach(r => {
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

      if (jobDate.getTime() <= today.getTime()) {
        _today.push(r);
      } else {
        _upcoming.push(r);
      }
    });
    return { todayJobs: _today, upcomingJobs: _upcoming };
  }, [allJobs]);

  const baseList = view === "TODAY" ? todayJobs : upcomingJobs;
  const displayedJobs = showPartsOnly 
    ? baseList.filter(job => job.request_parts && job.request_parts.length > 0)
    : baseList;

  const loadoutCount = useMemo(() => baseList.reduce((acc, job) => acc + (job.request_parts?.length || 0), 0), [baseList]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans pb-32">
      
      {/* HEADER */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-5 py-5 sticky top-0 z-30 flex justify-between items-center shadow-2xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <div className="bg-white text-black text-[10px] font-black px-1.5 py-0.5 rounded italic tracking-tighter">REVLET</div>
             <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Tech App</span>
          </div>
          <h1 className="text-xl font-black tracking-tight text-white">
            {userName}
          </h1>
        </div>
        <div className="flex items-center gap-2">
            <button onClick={refreshData} disabled={isRefreshing} className={clsx("p-3 rounded-full bg-zinc-800 text-zinc-400 hover:text-white", isRefreshing && "animate-spin text-white")}>
                <IconRefresh />
            </button>
            <button onClick={handleLogout} className="p-3 rounded-full bg-zinc-800 text-zinc-400 hover:text-red-400">
                <IconLogout />
            </button>
        </div>
      </div>

      {/* VIEW TOGGLE */}
      <div className="p-4 sticky top-[80px] z-20 bg-black/90 backdrop-blur-xl">
        <div className="bg-zinc-900 p-1 rounded-xl flex gap-1 border border-zinc-800 shadow-lg">
          <button onClick={() => { setView("TODAY"); setShowPartsOnly(false); }} className={clsx("flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-lg transition-all", view === "TODAY" ? "bg-white text-black shadow-lg" : "text-zinc-500")}>
            Today <span className="opacity-50">({todayJobs.length})</span>
          </button>
          <button onClick={() => { setView("UPCOMING"); setShowPartsOnly(false); }} className={clsx("flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-lg transition-all", view === "UPCOMING" ? "bg-white text-black shadow-lg" : "text-zinc-500")}>
            Upcoming <span className="opacity-50">({upcomingJobs.length})</span>
          </button>
        </div>
      </div>

      {/* PARTS BANNER */}
      {baseList.length > 0 && loadoutCount > 0 && (
        <div className="px-4 mb-4">
          <button 
            onClick={() => setShowPartsOnly(!showPartsOnly)}
            className={clsx(
              "w-full rounded-2xl p-4 flex justify-between items-center active:scale-[0.98] transition shadow-lg border text-left",
              showPartsOnly ? "bg-white border-white text-black" : "bg-amber-400 border-amber-300 text-black"
            )}
          >
            <div className="flex items-center gap-4">
              <div className={clsx("p-2.5 rounded-xl", showPartsOnly ? "bg-black text-white" : "bg-black/10 text-black")}>
                 {showPartsOnly ? <IconX /> : <IconBox />}
              </div>
              <div>
                <div className="font-black text-xs uppercase tracking-wider leading-none">
                   {showPartsOnly ? "Showing Parts Jobs Only" : "Daily Parts Prep"}
                </div>
                <div className="text-[11px] font-bold opacity-70 mt-1">
                   {loadoutCount} items to verify for {view.toLowerCase()}
                </div>
              </div>
            </div>
            <div className={clsx("px-3 py-1.5 rounded-lg text-[10px] font-black uppercase", showPartsOnly ? "bg-black text-white" : "bg-black/90 text-white")}>
               {showPartsOnly ? "Clear" : "Filter"}
            </div>
          </button>
        </div>
      )}

      {/* JOB LIST */}
      <div className="px-4 space-y-4">
        {displayedJobs.length === 0 ? (
           <div className="text-center py-24 px-10 bg-zinc-900/30 rounded-3xl border-2 border-dashed border-zinc-800">
              <p className="text-zinc-500 font-black uppercase tracking-widest text-xs mb-2">No Jobs Found</p>
              <p className="text-zinc-600 text-sm font-medium">
                 {showPartsOnly ? "No jobs require parts." : "You are all caught up!"}
              </p>
           </div>
        ) : (
          displayedJobs.map((r) => {
            const isLive = r.status === 'IN_PROGRESS';
            const hasParts = r.request_parts && r.request_parts.length > 0;
            const timeString = r.scheduled_start_at 
                ? new Date(r.scheduled_start_at).toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'})
                : "TBD";

            return (
                <div 
                  key={r.id}
                  onClick={() => router.push(`/tech/jobs/${r.id}`)}
                  className={clsx(
                      "rounded-3xl p-5 border active:scale-[0.97] transition relative overflow-hidden shadow-lg cursor-pointer",
                      isLive ? "bg-zinc-800 border-green-500/50 shadow-green-900/10" : "bg-zinc-900 border-zinc-800"
                  )}
                >
                  <div className={clsx("absolute left-0 top-0 bottom-0 w-1.5", isLive ? "bg-green-500" : "bg-blue-600")} />

                  {/* Top Row: Time & Status */}
                  <div className="flex justify-between items-start mb-2 pl-3">
                      <div className="flex items-center gap-2">
                          <div className={clsx("text-xs font-black px-2 py-1 rounded border", isLive ? "bg-green-500 text-black border-green-500" : "bg-black text-white border-zinc-700")}>
                              {isLive ? "ACTIVE NOW" : timeString}
                          </div>
                          {hasParts && <div className="text-[10px] font-bold bg-amber-400 text-black px-2 py-1 rounded flex items-center gap-1"><IconBox /> Parts</div>}
                      </div>
                  </div>

                  {/* Middle Row: Customer (BIG) */}
                  <div className="pl-3 mb-1">
                      <div className="text-2xl font-black text-white tracking-tight leading-none truncate pr-2">
                        {r.customer?.name}
                      </div>
                  </div>

                  {/* Bottom Row: Vehicle & Service */}
                  <div className="pl-3 flex flex-col gap-1">
                      <div className="text-sm font-bold text-zinc-400">
                        {r.vehicle?.year} {r.vehicle?.model} 
                        <span className="ml-2 bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded text-[10px] font-mono border border-zinc-700">{r.vehicle?.plate}</span>
                      </div>
                      <div className="text-xs font-medium text-zinc-500 uppercase tracking-wide truncate mt-1">
                        {r.service_title}
                      </div>
                  </div>
                </div>
            );
          })
        )}
      </div>
    </div>
  );
}