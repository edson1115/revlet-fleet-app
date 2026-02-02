"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

const IconBell = () => <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;

export default function ActivityFeed() {
  const [activities, setActivities] = useState<any[]>([]);
  const [hasUnread, setHasUnread] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    // 1. Fetch initial recent activity
    const fetchInitial = async () => {
      const { data } = await supabase
        .from('activity_feed')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      if (data) setActivities(data);
    };
    fetchInitial();

    // 2. Subscribe to LIVE updates
    const channel = supabase
      .channel('activity_feed_live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_feed' }, (payload) => {
          const newEvent = payload.new;
          setActivities((prev) => [newEvent, ...prev].slice(0, 10)); // Keep top 10
          setHasUnread(true);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  return (
    <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-black text-zinc-900 uppercase tracking-tight text-sm flex items-center gap-2">
            <IconBell /> Live Feed {/* ✅ Renamed */}
            {hasUnread && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"/>}
        </h3>
        <button onClick={() => setHasUnread(false)} className="text-[10px] font-bold text-zinc-400 hover:text-black">
            Mark Read
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3">
        {activities.length === 0 ? (
            <div className="text-center text-zinc-400 text-xs py-4">No recent activity.</div>
        ) : (
            activities.map((act) => (
                <div key={act.id} className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 animate-in slide-in-from-left-2">
                    <div className="flex justify-between items-start">
                        <span className="text-[10px] font-black uppercase tracking-wide text-zinc-400">
                            {new Date(act.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                        {act.activity_type === 'NEW_REQUEST' && <span className="text-[9px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">NEW</span>}
                        {act.activity_type === 'TECH_RESCHEDULE' && <span className="text-[9px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded">ALERT</span>}
                        {act.activity_type === 'STATUS_CHANGE' && <span className="text-[9px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded">UPDATE</span>}
                    </div>
                    <p className="text-xs font-bold text-zinc-800 mt-1 leading-snug">{act.message}</p>
                </div>
            ))
        )}
      </div>
    </div>
  );
}