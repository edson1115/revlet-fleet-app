"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

const IconX = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const IconStar = () => <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>;

export default function XpHistoryModal({ userId, onClose }: { userId: string, onClose: () => void }) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchHistory = async () => {
      const { data } = await supabase
        .from('xp_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (data) setHistory(data);
      setLoading(false);
    };
    fetchHistory();
  }, [userId, supabase]);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm p-6 flex flex-col animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">XP Ledger</h2>
            <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">Recent Activity</p>
          </div>
          <button onClick={onClose} className="p-2 bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition">
            <IconX />
          </button>
      </div>
      
      {/* List */}
      <div className="flex-1 overflow-y-auto space-y-3">
          {loading ? (
             <div className="text-zinc-500 text-center py-10 animate-pulse text-xs font-bold uppercase tracking-widest">Loading Records...</div>
          ) : history.length === 0 ? (
             <div className="text-zinc-600 text-center py-10 text-sm font-medium">No history found yet. Go do some work!</div>
          ) : (
             history.map((item) => (
                <div key={item.id} className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex justify-between items-center">
                    <div>
                        <div className="font-bold text-white text-sm mb-0.5">{item.description}</div>
                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">
                            {new Date(item.created_at).toLocaleDateString()} • {new Date(item.created_at).toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'})}
                        </div>
                    </div>
                    <div className="bg-zinc-800 border border-zinc-700 text-white font-black text-sm px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm">
                        <IconStar /> +{item.points_earned}
                    </div>
                </div>
             ))
          )}
      </div>
    </div>
  );
}