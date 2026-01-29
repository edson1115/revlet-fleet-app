"use client";

import { useMemo } from "react";
import clsx from "clsx";

const IconX = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const IconCheck = () => <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>;
const IconLock = () => <svg className="w-3 h-3 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>;

// THE REWARDS CONFIG
const TIERS = [
  { 
    name: "ROOKIE", min: 0, color: "bg-zinc-500", 
    perks: ["Access to Tech App", "Standard Uniform"] 
  },
  { 
    name: "BRONZE TECH", min: 1000, color: "bg-amber-700", 
    perks: ["OT First Dibs (1hr early)", "Branded Gear Pack"] 
  },
  { 
    name: "SILVER TECH", min: 2500, color: "bg-slate-400", 
    perks: ["Route Preference (3 Zones)", "$100 Tool Allowance"] 
  },
  { 
    name: "GOLD TECH", min: 5000, color: "bg-yellow-500", 
    perks: ["Self-Dispatch Mode", "Mentor Status (Bonus Pay)"] 
  },
  { 
    name: "ELITE TECH", min: 10000, color: "bg-purple-600", 
    perks: ["The Golden Schedule (8-4)", "Fleet Vehicle Upgrade", "Emergency PTO Day"] 
  },
  { 
    name: "MASTER TECH", min: 25000, color: "bg-black", 
    perks: ["Profit Revenue Share", "Black Master Uniform", "Legend Status"] 
  },
];

export default function PerksModal({ currentXp, onClose }: { currentXp: number, onClose: () => void }) {
  
  // Calculate Progress for the "Next Level" bar
  const { nextLevel, progressToNext } = useMemo(() => {
    const nextIndex = TIERS.findIndex(t => t.min > currentXp);
    const next = nextIndex === -1 ? null : TIERS[nextIndex];
    const current = nextIndex === -1 ? TIERS[TIERS.length - 1] : TIERS[nextIndex - 1] || TIERS[0];
    
    let progress = 100;
    if (next) {
        const range = next.min - current.min;
        const gained = currentXp - current.min;
        progress = (gained / range) * 100;
    }
    return { nextLevel: next, progressToNext: progress };
  }, [currentXp]);

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md p-6 flex flex-col animate-in slide-in-from-bottom-10 duration-300">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Career Path</h2>
            <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">Perks & Unlocks</p>
          </div>
          <button onClick={onClose} className="p-2 bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition">
            <IconX />
          </button>
      </div>
      
      <div className="flex-1 overflow-y-auto pb-10 space-y-8 relative">
          
          {/* Vertical Line */}
          <div className="absolute left-[19px] top-4 bottom-0 w-0.5 bg-zinc-800 -z-10" />

          {TIERS.map((tier, i) => {
             const isUnlocked = currentXp >= tier.min;
             const isNext = !isUnlocked && (i === 0 || currentXp >= TIERS[i-1].min);
             
             return (
                <div key={tier.name} className={clsx("flex gap-5 relative", !isUnlocked && !isNext && "opacity-40 grayscale")}>
                    
                    {/* Node */}
                    <div className={clsx(
                        "w-10 h-10 rounded-full flex items-center justify-center border-4 flex-shrink-0 z-10 transition-all shadow-lg",
                        isUnlocked ? `${tier.color} border-black text-white` : "bg-zinc-900 border-zinc-800"
                    )}>
                        {isUnlocked ? <IconCheck /> : <span className="text-[10px] font-black text-zinc-600">{i + 1}</span>}
                    </div>

                    {/* Content */}
                    <div className="flex-1 pb-2">
                        <div className="flex justify-between items-center mb-1">
                            <h3 className={clsx("font-black uppercase tracking-wide", isUnlocked ? "text-white" : "text-zinc-500")}>
                                {tier.name}
                            </h3>
                            <span className="text-[10px] font-bold text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                                {tier.min.toLocaleString()} XP
                            </span>
                        </div>

                        {/* Perks List */}
                        <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4 space-y-2">
                            {tier.perks.map((perk, idx) => (
                                <div key={idx} className="flex items-start gap-2">
                                    <div className={clsx("mt-1", isUnlocked ? "text-green-500" : "text-zinc-600")}>
                                        {isUnlocked ? "✓" : <IconLock />}
                                    </div>
                                    <span className={clsx("text-xs font-medium", isUnlocked ? "text-zinc-300" : "text-zinc-600")}>
                                        {perk}
                                    </span>
                                </div>
                            ))}
                        </div>
                        
                        {/* Progress Bar (Only for Next Level) */}
                        {isNext && (
                            <div className="mt-3">
                                <div className="flex justify-between text-[9px] font-bold uppercase text-zinc-500 mb-1">
                                    <span>Progress to {tier.name}</span>
                                    <span>{Math.floor(progressToNext)}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${progressToNext}%` }} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
             );
          })}
      </div>
    </div>
  );
}