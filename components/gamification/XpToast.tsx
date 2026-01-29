"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

export default function XpToast({ userId }: { userId: string }) {
  const [notification, setNotification] = useState<{ amount: number, show: boolean } | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    // 1. Subscribe to changes on MY xp_stats row
    const channel = supabase
      .channel('xp-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_xp_stats',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const oldXp = payload.old.total_xp;
          const newXp = payload.new.total_xp;
          const diff = newXp - oldXp;

          if (diff > 0) {
            // 2. Trigger the "Toast"
            setNotification({ amount: diff, show: true });
            
            // 3. Hide it after 4 seconds
            setTimeout(() => setNotification(null), 4000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase]);

  if (!notification?.show) return null;

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-10 duration-500">
      <div className="bg-black/90 text-white backdrop-blur-md border border-yellow-500/50 px-6 py-3 rounded-full shadow-2xl shadow-yellow-500/20 flex items-center gap-3">
        <div className="bg-yellow-500 text-black font-black text-xs w-6 h-6 rounded-full flex items-center justify-center animate-pulse">
          XP
        </div>
        <span className="font-black text-lg text-yellow-400">+{notification.amount}</span>
        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Level Up!</span>
      </div>
    </div>
  );
}