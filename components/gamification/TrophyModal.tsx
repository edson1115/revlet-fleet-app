"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import clsx from "clsx";

const IconX = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const IconLock = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>;

export default function TrophyModal({ userId, onClose }: { userId: string, onClose: () => void }) {
  const [badges, setBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchData = async () => {
      // 1. Get all possible achievements
      const { data: allBadges } = await supabase.from('achievements').select('*').order('xp_bonus', { ascending: true });
      
      // 2. Get user's unlocked achievements
      const { data: myBadges } = await supabase.from('user_achievements').select('achievement_id, earned_at').eq('user_id', userId);
      
      // 3. Merge them
      const unlockedIds = new Set(myBadges?.map(b => b.achievement_id));
      
      const merged = (allBadges || []).map(badge => ({
        ...badge,
        unlocked: unlockedIds.has(badge.id),
        earned_at: myBadges?.find(b => b.achievement_id === badge.id)?.earned_at
      }));

      setBadges(merged);
      setLoading(false);
    };
    fetchData();
  }, [userId, supabase]);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md p-6 flex flex-col animate-in fade-in duration-300">
      
      <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Trophy Case</h2>
            <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">Achievements & Honors</p>
          </div>
          <button onClick={onClose} className="p-2 bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition">
            <IconX />
          </button>
      </div>
      
      <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-4 pb-10">
          {loading ? (
             <div className="col-span-2 text-zinc-500 text-center py-10 animate-pulse text-xs font-bold">Loading Trophies...</div>
          ) : (
             badges.map((badge) => (
                <div 
                    key={badge.id} 
                    className={clsx(
                        "relative p-4 rounded-2xl border flex flex-col items-center text-center gap-3 transition-all duration-500",
                        badge.unlocked 
                            ? "bg-gradient-to-b from-zinc-800 to-zinc-900 border-yellow-500/30 shadow-lg shadow-yellow-900/10" 
                            : "bg-zinc-900/50 border-zinc-800 opacity-60 grayscale"
                    )}
                >
                    {/* Icon Bubble */}
                    <div className={clsx(
                        "w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-inner",
                        badge.unlocked ? "bg-black/40" : "bg-black/20"
                    )}>
                        {badge.unlocked ? badge.icon : <IconLock className="text-zinc-600" />}
                    </div>

                    <div>
                        <div className={clsx("font-black text-sm uppercase tracking-wide", badge.unlocked ? "text-white" : "text-zinc-500")}>
                            {badge.name}
                        </div>
                        <div className="text-[10px] font-medium text-zinc-500 leading-tight mt-1 px-2">
                            {badge.description}
                        </div>
                    </div>

                    {/* Status Footer */}
                    <div className="mt-auto pt-3 w-full border-t border-white/5">
                        {badge.unlocked ? (
                            <div className="text-[9px] font-bold text-yellow-500 uppercase tracking-widest animate-pulse">
                                Unlocked {new Date(badge.earned_at).toLocaleDateString()}
                            </div>
                        ) : (
                            <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">
                                Locked • +{badge.xp_bonus} XP
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