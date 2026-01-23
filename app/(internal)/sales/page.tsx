"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

export default function SalesDashboard() {
  const router = useRouter();
  
  // Real Data State
  const [stats, setStats] = useState({ total: 0, converted: 0, active: 0, daily_goal: 5, daily_current: 0 });
  const [insight, setInsight] = useState<any>(null); // The AI Pick
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const init = async () => {
        // 1. Get Session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return router.push("/login");
        setUser(session.user);

        // 2. Fetch REAL Leads from Database
        const { data: leads, error } = await supabase
            .from("sales_leads")
            .select("*")
            .eq("sales_rep_id", session.user.id)
            .order("created_at", { ascending: false });

        if (leads) {
            // A. Calculate Stats
            const today = new Date().toDateString();
            const visitsToday = leads.filter(l => new Date(l.created_at).toDateString() === today).length;
            const convertedCount = leads.filter(l => l.customer_status === "WON" || l.customer_status === "CONVERTED").length;

            setStats({
                total: leads.length,
                converted: convertedCount,
                active: leads.length - convertedCount,
                daily_goal: 5,
                daily_current: visitsToday
            });

            // B. Run "The Brain" (Scoring Algorithm) 🧠
            let bestLead = null;
            let highestScore = -1;

            leads.forEach(lead => {
                if (lead.customer_status === "WON" || lead.customer_status === "CONVERTED") return;

                let score = 0;
                
                // 1. Check Text Notes
                const notes = (lead.notes || "").toLowerCase();
                if (notes.includes("high interest")) score += 50;
                if (notes.includes("fleet")) score += 30;
                if (notes.includes("urgent")) score += 40;

                // 2. Check Tags Array
                const tags = Array.isArray(lead.tags) ? lead.tags : [];
                if (tags.includes("High Interest")) score += 50;
                if (tags.includes("Fleet 50+")) score += 40;
                if (tags.includes("Fleet 10-50")) score += 20;
                if (tags.includes("Follow Up ASAP")) score += 30;

                // 3. Freshness Bonus
                const daysOld = (new Date().getTime() - new Date(lead.created_at).getTime()) / (1000 * 3600 * 24);
                if (daysOld < 3) score += 15;
                if (daysOld > 14) score -= 10;

                if (score > highestScore) {
                    highestScore = score;
                    bestLead = lead;
                }
            });

            setInsight(bestLead);
        }
        setLoading(false);
    };
    init();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
    router.replace("/login");
  };

  if (loading) return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
  );

  const progress = Math.min((stats.daily_current / stats.daily_goal) * 100, 100);

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white pb-24 font-sans selection:bg-blue-500/30">
      
      {/* --- 1. COMMAND CENTER HEADER --- */}
      <div className="relative p-6 pt-8 pb-12 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[300px] h-[300px] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute top-[10%] right-[-10%] w-[200px] h-[200px] bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none"></div>

        <div className="relative z-10 flex justify-between items-start mb-6">
            <div className="flex items-center gap-2 opacity-80">
                <div className="bg-white text-black font-black italic px-2 py-0.5 rounded text-xs">R</div>
                <span className="font-bold tracking-widest text-xs uppercase text-slate-400">Revlet OS</span>
            </div>
            <button onClick={handleLogout} className="text-[10px] font-bold text-slate-500 hover:text-white transition-colors border border-slate-800 px-3 py-1 rounded-full">
                LOG OUT
            </button>
        </div>

        <div className="relative z-10">
            <h1 className="text-3xl font-bold tracking-tight text-white mb-1">
                {getGreeting()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">{user?.user_metadata?.full_name?.split(' ')[0]}</span>.
            </h1>
            <p className="text-slate-400 text-sm">
                {stats.daily_current === 0 ? "Ready to crush the day?" : "Great momentum today."}
            </p>
        </div>
      </div>

      <div className="px-6 space-y-6 -mt-4 relative z-20">

        {/* --- 2. THE "DAILY GRIND" --- */}
        <div className="bg-white/5 border border-white/10 backdrop-blur-xl p-5 rounded-3xl shadow-2xl">
            <div className="flex justify-between items-end mb-2">
                <div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Daily Goal</div>
                    <div className="text-xl font-bold">{stats.daily_current} <span className="text-slate-500 text-sm font-medium">/ {stats.daily_goal} visits</span></div>
                </div>
                <div className="text-emerald-400 text-[10px] font-bold bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
                    {progress >= 100 ? "🎉 GOAL HIT!" : `${Math.round(progress)}% DONE`}
                </div>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
        </div>

        {/* --- 3. SMART ACTIONS --- */}
        <div className="grid grid-cols-2 gap-4">
            <Link href="/sales/leads/new" className="group relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br from-blue-600 to-blue-800 shadow-lg shadow-blue-900/40 border border-white/10 active:scale-[0.95] transition-transform">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/></svg>
                </div>
                <div className="relative z-10">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mb-3 backdrop-blur-sm">
                        <span className="text-xl">📍</span>
                    </div>
                    <div className="font-bold text-lg">Check In</div>
                    <div className="text-blue-200 text-xs mt-1">Log a new visit</div>
                </div>
            </Link>

            <div className="grid grid-rows-2 gap-4">
                 <Link href="/sales/leads" className="bg-white/5 border border-white/10 rounded-3xl p-4 flex items-center gap-3 hover:bg-white/10 transition active:scale-[0.98]">
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-sm">📂</div>
                    <div>
                        <div className="font-bold text-sm">Pipeline</div>
                        <div className="text-[10px] text-slate-500">{stats.active} Active Leads</div>
                    </div>
                 </Link>
                 
                 {/* 🛠️ THIS BUTTON IS NOW CONNECTED */}
                 <Link href="/sales/territory" className="bg-white/5 border border-white/10 rounded-3xl p-4 flex items-center gap-3 hover:bg-white/10 transition active:scale-[0.98]">
                    <div className="w-8 h-8 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-sm">🗺️</div>
                    <div>
                        <div className="font-bold text-sm">Territory</div>
                        <div className="text-[10px] text-slate-500">Shops near me</div>
                    </div>
                 </Link>
            </div>
        </div>

        {/* --- 4. SMART NUDGE --- */}
        {insight ? (
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 rounded-3xl p-5 relative overflow-hidden shadow-xl">
                <div className="absolute top-3 right-3 text-[9px] font-black bg-black/40 px-2 py-0.5 rounded text-emerald-400 border border-emerald-500/30 tracking-widest uppercase">AI Insight</div>
                <div className="flex gap-4 items-start mt-1">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-xl shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                        🤖
                    </div>
                    <div>
                        <h3 className="font-bold text-sm text-white mb-1">Top Pick: {insight.company_name}</h3>
                        <p className="text-xs text-slate-400 leading-relaxed mb-3">
                            This lead scored high because of the tag: 
                            <span className="text-emerald-400 font-bold"> {getTopTag(insight.notes, insight.tags)}</span>. 
                            Follow up now to convert.
                        </p>
                        <div className="flex gap-2">
                            <button onClick={() => alert(`Calling ${insight.contact_name}...`)} className="text-[10px] bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-lg font-bold transition-colors flex items-center gap-1 shadow-lg shadow-emerald-900/20">
                                📞 Call {insight.contact_name}
                            </button>
                            <button onClick={() => alert("Opening Maps...")} className="text-[10px] bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-lg font-bold transition-colors flex items-center gap-1">
                                🗺️ Map
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        ) : (
            <div className="bg-white/5 border border-white/10 rounded-3xl p-5 text-center">
                <div className="text-2xl mb-2 grayscale opacity-50">🌱</div>
                <h3 className="font-bold text-sm text-slate-300">Pipeline is Empty</h3>
                <p className="text-xs text-slate-500 mt-1">Log your first visit to get AI insights.</p>
            </div>
        )}

        {/* --- 5. PERFORMANCE WIDGETS --- */}
        <h2 className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-8 mb-4 ml-1">Live Performance</h2>
        <div className="grid grid-cols-3 gap-3">
             <StatCard label="Win Rate" value={`${Math.round((stats.converted / (stats.total || 1)) * 100)}%`} trend="---" color="text-blue-400" />
             <StatCard label="Pipeline" value={stats.active} trend="+1" color="text-emerald-400" />
             <StatCard label="Won Deals" value={stats.converted} trend="---" color="text-purple-400" />
        </div>

      </div>
    </div>
  );
}

// --- HELPER FUNCTIONS ---

function StatCard({ label, value, trend, color }: any) {
    return (
        <div className="bg-white/5 border border-white/5 rounded-2xl p-3 text-center backdrop-blur-sm">
            <div className={`text-xl font-black ${color} mb-1 drop-shadow-sm`}>{value}</div>
            <div className="text-[9px] text-slate-500 font-black uppercase tracking-wider">{label}</div>
        </div>
    );
}

function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
}

function getTopTag(notes: string, tags: string[]) {
    if (tags?.includes("High Interest")) return "High Interest";
    if (tags?.includes("Fleet 50+")) return "Fleet 50+";
    if (tags?.includes("Follow Up ASAP")) return "Urgent";
    
    if (notes?.includes("High Interest")) return "High Interest";
    return "High Priority";
}