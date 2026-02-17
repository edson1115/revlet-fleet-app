"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import clsx from "clsx";
import Link from "next/link";
import { format, isToday, isYesterday, isThisWeek, parseISO } from "date-fns";

export default function SalesPipeline() {
  const router = useRouter();
  const [allLeads, setAllLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // VIEW MODE: 'PIPELINE' (Active Deals) vs 'HISTORY' (Time Log)
  const [viewMode, setViewMode] = useState<'PIPELINE' | 'HISTORY'>('PIPELINE');

  // ✅ FIX: Wrap in useMemo with fallbacks to prevent crash during build-time prerendering
  const supabase = useMemo(() => {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
    );
  }, []);

  useEffect(() => {
    // Only attempt fetch if we actually have a URL (safety check for build)
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;

    const fetchLeads = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return router.push("/login");

        const { data } = await supabase
            .from("sales_leads")
            .select("*")
            .eq("sales_rep_id", session.user.id)
            .order("created_at", { ascending: false });
        
        setAllLeads(data || []);
        setLoading(false);
    };
    fetchLeads();
  }, [router, supabase]);

  // --- 1. PIPELINE LOGIC ---
  const pipelineLeads = allLeads.filter(l => l.customer_status !== 'WON' && l.customer_status !== 'LOST');
  
  // --- 2. HISTORY LOGIC ---
  const historyGroups = {
      today: allLeads.filter(l => isToday(parseISO(l.created_at))),
      yesterday: allLeads.filter(l => isYesterday(parseISO(l.created_at))),
      thisWeek: allLeads.filter(l => !isToday(parseISO(l.created_at)) && !isYesterday(parseISO(l.created_at)) && isThisWeek(parseISO(l.created_at))),
      older: allLeads.filter(l => !isThisWeek(parseISO(l.created_at)))
  };

  // --- 3. AI STRATEGY ENGINE ---
  const generateStrategy = () => {
      const weeklyVolume = historyGroups.thisWeek.length + historyGroups.today.length + historyGroups.yesterday.length;
      const highInterestCount = allLeads.filter(l => (l.tags || []).includes("High Interest")).length;
      
      if (weeklyVolume < 5) return { 
          title: "Volume Alert", 
          text: "Your visit volume is low this week. Goal: Hit 5 stops tomorrow to rebuild momentum.", 
          color: "text-amber-400" 
      };
      
      if ((highInterestCount / (allLeads.length || 1)) < 0.2) return {
          title: "Quality Check",
          text: "You're seeing many fleets, but 'High Interest' is low. Try asking the 'Pain Point' question earlier in the pitch.",
          color: "text-blue-400"
      };

      return {
          title: "Closing Mode",
          text: `You have ${pipelineLeads.length} active deals. The AI predicts 2 are ready to close. Focus on follow-ups today.`,
          color: "text-emerald-400"
      };
  };

  const strategy = generateStrategy();

  if (loading) return <div className="min-h-screen bg-[#0B0F19] text-white flex items-center justify-center">Loading Data...</div>;

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white font-sans pb-24 selection:bg-blue-500/30">
      
      {/* HEADER */}
      <div className="p-6 pt-8 bg-[#0B0F19] sticky top-0 z-20 border-b border-white/5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
              <Link href="/sales" className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1 transition-colors">
                ← DASHBOARD
              </Link>
              <div className="flex bg-slate-800 rounded-lg p-1">
                  <button 
                    onClick={() => setViewMode('PIPELINE')}
                    className={clsx("px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest transition-all", viewMode === 'PIPELINE' ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white")}
                  >
                    🔥 Active
                  </button>
                  <button 
                    onClick={() => setViewMode('HISTORY')}
                    className={clsx("px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest transition-all", viewMode === 'HISTORY' ? "bg-slate-600 text-white shadow" : "text-slate-400 hover:text-white")}
                  >
                    📅 History
                  </button>
              </div>
          </div>
          
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 p-4 rounded-2xl relative overflow-hidden mb-2">
              <div className="flex gap-3 items-start">
                  <div className="text-2xl">🤖</div>
                  <div>
                      <h3 className={`text-xs font-black uppercase tracking-widest mb-1 ${strategy.color}`}>AI Coach: {strategy.title}</h3>
                      <p className="text-xs text-slate-300 leading-relaxed max-w-sm">
                          {strategy.text}
                      </p>
                  </div>
              </div>
          </div>
      </div>

      {/* PIPELINE VIEW */}
      {viewMode === 'PIPELINE' && (
          <div className="px-4 mt-6 space-y-3">
            <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest px-2 mb-2">Deals to Close ({pipelineLeads.length})</h2>
            {pipelineLeads.length === 0 ? (
                <div className="text-center py-20 text-slate-500 opacity-50">
                    <div className="text-4xl mb-2">📭</div>
                    <p>Pipeline empty. Go hunt!</p>
                </div>
            ) : (
                pipelineLeads.map((lead) => {
                    const tags = Array.isArray(lead.tags) ? lead.tags : [];
                    const isHot = tags.includes("High Interest") || tags.includes("Urgent");
                    return (
                        <div key={lead.id} className="bg-white/5 border border-white/10 p-5 rounded-2xl active:scale-[0.98] transition-transform relative overflow-hidden group">
                            {isHot && <div className="absolute top-0 right-0 w-16 h-16 bg-orange-500/20 blur-[30px] rounded-full pointer-events-none"></div>}
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-2">
                                     <h3 className="text-lg font-bold text-white leading-tight">{lead.company_name}</h3>
                                     {isHot && <span className="text-[9px] font-black bg-orange-500 text-black px-2 py-0.5 rounded shadow-lg shadow-orange-500/20">HOT</span>}
                                </div>
                                <div className="text-sm text-slate-400 mb-3 flex items-center gap-2">
                                    <span>👤 {lead.contact_name}</span>
                                    <span className="text-slate-700">•</span>
                                    <span className="text-xs font-mono text-slate-500">Last visit: {format(parseISO(lead.created_at), 'MMM d')}</span>
                                </div>
                                <div className="flex gap-2 mt-4">
                                     <a href={`tel:${lead.phone}`} className="flex-1 bg-white/5 hover:bg-white/10 border border-white/5 text-white py-3 rounded-xl text-xs font-bold transition-colors text-center">
                                         Call Contact
                                     </a>
                                     <button className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl text-xs font-bold transition-colors shadow-lg shadow-blue-900/20">
                                         Log Follow-up
                                     </button>
                                </div>
                            </div>
                        </div>
                    );
                })
            )}
          </div>
      )}

      {/* HISTORY VIEW */}
      {viewMode === 'HISTORY' && (
          <div className="px-4 mt-6 space-y-8">
              {historyGroups.today.length > 0 && (
                  <div className="space-y-3">
                      <div className="flex items-center gap-2 px-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                          <h2 className="text-xs font-black text-white uppercase tracking-widest">Today</h2>
                      </div>
                      {historyGroups.today.map(lead => <HistoryCard key={lead.id} lead={lead} />)}
                  </div>
              )}
              {historyGroups.yesterday.length > 0 && (
                  <div className="space-y-3">
                      <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest px-2">Yesterday</h2>
                      {historyGroups.yesterday.map(lead => <HistoryCard key={lead.id} lead={lead} />)}
                  </div>
              )}
              {historyGroups.thisWeek.length > 0 && (
                  <div className="space-y-3">
                      <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest px-2">Earlier This Week</h2>
                      {historyGroups.thisWeek.map(lead => <HistoryCard key={lead.id} lead={lead} />)}
                  </div>
              )}
              {historyGroups.older.length > 0 && (
                  <div className="space-y-3">
                      <h2 className="text-xs font-black text-slate-600 uppercase tracking-widest px-2">Older History</h2>
                      {historyGroups.older.map(lead => <HistoryCard key={lead.id} lead={lead} />)}
                  </div>
              )}
              {allLeads.length === 0 && (
                  <div className="text-center py-20 text-slate-600 font-mono text-xs">
                      No history recorded yet.
                  </div>
              )}
          </div>
      )}

      {/* FAB */}
      <Link href="/sales/leads/new" className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-full flex items-center justify-center shadow-2xl shadow-blue-500/40 active:scale-90 transition-transform z-50">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
      </Link>
    </div>
  );
}

function HistoryCard({ lead }: { lead: any }) {
    const isWon = lead.customer_status === 'WON';
    const tags = Array.isArray(lead.tags) ? lead.tags : [];
    
    return (
        <div className={clsx("p-4 rounded-xl border flex items-center justify-between", 
            isWon ? "bg-emerald-900/10 border-emerald-500/20" : "bg-white/5 border-white/5"
        )}>
            <div>
                <div className="font-bold text-sm text-white flex items-center gap-2">
                    {lead.company_name}
                    {isWon && <span className="text-[8px] bg-emerald-500 text-black px-1.5 py-0.5 rounded font-black uppercase">WON</span>}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                    {tags.slice(0, 2).join(", ") || "No tags"}
                </div>
            </div>
            <div className="text-right">
                <div className="text-[10px] font-mono text-slate-400">
                    {format(parseISO(lead.created_at), 'h:mm a')}
                </div>
            </div>
        </div>
    );
}