"use client";

import { useState, useMemo } from "react";
import clsx from "clsx";
import LeaderboardTable from "@/components/gamification/LeaderboardTable";
import GrantXpModal from "@/components/gamification/GrantXpModal"; // ✅ Import

const IconBolt = () => <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>;

export default function LeaderboardClient({ initialPlayers }: { initialPlayers: any[] }) {
  const [filter, setFilter] = useState<"TECH" | "SALES">("TECH");
  const [showGrantModal, setShowGrantModal] = useState(false); // ✅ State

  const displayedPlayers = useMemo(() => {
    return initialPlayers
      .filter(p => {
        if (filter === "TECH") return p.role === "TECHNICIAN" || p.role === "TECH";
        if (filter === "SALES") return p.role === "SALES" || p.role === "OUTSIDE_SALES"; 
        return false;
      })
      .sort((a, b) => b.xp - a.xp);
  }, [initialPlayers, filter]);

  const topPerformer = displayedPlayers[0];
  const totalXp = displayedPlayers.reduce((sum, p) => sum + p.xp, 0);

  // We need the raw 'user_id' (which we mapped to 'id' in the page.tsx) for the modal
  // To be safe, ensure initialPlayers contains the correct user_id. 
  // In your Page.tsx previously, `id` was the `user_xp_stats.id`. We need the `user_id`.
  // **NOTE:** You might need to check your page.tsx map function. 
  // Assuming `id` passed to GrantModal needs to be the `user_id`. 
  // Let's assume you fix the map in page.tsx or we pass `user_id` explicitly.

  return (
    <main className="max-w-5xl mx-auto px-8 py-10 space-y-8">
         
         {/* HEADER ACTIONS */}
         <div className="flex justify-between items-center">
             
             {/* TOGGLE */}
             <div className="bg-zinc-200 p-1 rounded-xl flex gap-1 shadow-inner">
                <button 
                    onClick={() => setFilter("TECH")}
                    className={clsx("px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all", filter === "TECH" ? "bg-white text-black shadow-md" : "text-zinc-500")}
                >
                    🔧 Techs
                </button>
                <button 
                    onClick={() => setFilter("SALES")}
                    className={clsx("px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all", filter === "SALES" ? "bg-white text-black shadow-md" : "text-zinc-500")}
                >
                    💼 Sales
                </button>
             </div>

             {/* ✅ GRANT BUTTON */}
             <button 
                onClick={() => setShowGrantModal(true)}
                className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-zinc-800 shadow-lg shadow-black/20 active:scale-95 transition"
             >
                <IconBolt /> Grant Bonus
             </button>
         </div>

         {/* HERO STATS (Same as before...) */}
         <div className="grid grid-cols-3 gap-4">
            {/* ... keep existing hero code ... */}
            {/* Shortened for brevity, keep your existing Hero block here */}
            <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Total XP</div>
                <div className="text-3xl font-black text-zinc-900">{totalXp.toLocaleString()}</div>
            </div>
         </div>

         {/* THE BOARD */}
         <LeaderboardTable data={displayedPlayers.map(p => ({
             id: p.id,
             total_xp: p.xp,
             current_level: p.level,
             current_streak: p.streak,
             profiles: { full_name: p.name }
         }))} />

         {/* ✅ MODAL */}
         {showGrantModal && (
            <GrantXpModal 
                onClose={() => setShowGrantModal(false)}
                players={initialPlayers.map(p => ({ id: p.user_id, name: p.name, role: p.role }))} 
            />
         )}

    </main>
  );
}