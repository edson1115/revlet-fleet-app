"use client";

import { useMemo } from "react";

// The Rules of the Game
const LEVELS = [
  { name: "ROOKIE", min: 0, color: "bg-zinc-400", ring: "ring-zinc-400" },
  { name: "BRONZE", min: 1000, color: "bg-amber-700", ring: "ring-amber-700" },
  { name: "SILVER", min: 2500, color: "bg-slate-400", ring: "ring-slate-400" },
  { name: "GOLD", min: 5000, color: "bg-yellow-500", ring: "ring-yellow-500" },
  { name: "ELITE", min: 10000, color: "bg-purple-600", ring: "ring-purple-600" },
  { name: "MASTER", min: 25000, color: "bg-black", ring: "ring-black" },
];

export default function PlayerCard({ 
  xp = 0, 
  name = "Technician"
}: { 
  xp: number, 
  name: string
}) {
  
  // Logic: Calculate Level & Progress Bar
  const { current, next, progress } = useMemo(() => {
    const currentLevelIndex = LEVELS.slice().reverse().findIndex(l => xp >= l.min);
    const index = currentLevelIndex === -1 ? 0 : LEVELS.length - 1 - currentLevelIndex;
    
    const current = LEVELS[index];
    const next = LEVELS[index + 1] || { name: "LEGEND", min: xp * 1.5 }; // Cap if max
    
    const range = next.min - current.min;
    const gained = xp - current.min;
    // Prevent div by 0 and cap at 100%
    const rawProgress = range === 0 ? 100 : (gained / range) * 100;
    const progress = Math.min(100, Math.max(0, rawProgress));

    return { current, next, progress };
  }, [xp]);

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm relative overflow-hidden mb-6">
      
      {/* Background Texture */}
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
        <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
      </div>

      <div className="flex items-center gap-4 relative z-10">
        
        {/* Avatar / Rank Ring */}
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black text-white shadow-md ${current.color}`}>
           {name.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
           {/* Header Info */}
           <div className="flex justify-between items-end mb-1.5">
              <div>
                 <h2 className="text-lg font-black text-zinc-900 uppercase tracking-tight truncate">{name}</h2>
                 <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold text-white px-2 py-0.5 rounded ${current.color}`}>
                        {current.name} TECH
                    </span>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">
                        Level {LEVELS.indexOf(current) + 1}
                    </span>
                 </div>
              </div>
              <div className="text-right">
                 <div className="text-2xl font-black text-zinc-900 tabular-nums leading-none">{xp.toLocaleString()}</div>
                 <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">Total XP</div>
              </div>
           </div>

           {/* Progress Bar */}
           <div className="h-2.5 w-full bg-zinc-100 rounded-full overflow-hidden relative border border-zinc-100">
              <div 
                className={`h-full transition-all duration-1000 ease-out ${current.color}`} 
                style={{ width: `${progress}%` }}
              >
                 {/* Shimmer Animation */}
                 <div className="absolute top-0 left-0 bottom-0 w-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
              </div>
           </div>
           
           <div className="flex justify-between mt-1.5">
              <span className="text-[9px] font-bold text-zinc-400">Current</span>
              <span className="text-[9px] font-bold text-zinc-500">
                {Math.floor(next.min - xp)} XP to <span className="text-zinc-900">{next.name}</span>
              </span>
           </div>
        </div>
      </div>
    </div>
  );
}