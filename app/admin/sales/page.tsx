import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { resolveUserScope } from "@/lib/api/scope";
import { formatDistanceToNow, subDays } from "date-fns";

export const dynamic = "force-dynamic";

export default async function AdminSalesPage() {
  const scope = await resolveUserScope();
  if (!scope.isAdmin && !scope.isSuperadmin) redirect("/");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1. Fetch Reps & Leads
  // 🛠️ FIX: Changed "SALES_REP" to "SALES" to match your User Control settings
  const [repsRes, leadsRes] = await Promise.all([
    supabase.from("profiles").select("*").in("role", ["SALES", "SALES_REP", "ADMIN", "SUPERADMIN"]), 
    supabase.from("sales_leads").select("*").order("created_at", { ascending: false })
  ]);

  const reps = repsRes.data || [];
  const leads = leadsRes.data || [];

  // 2. Calculate Stats PER REP
  const repStats = reps.map(rep => {
      // 🔒 SEPARATION LOGIC: Only grab leads that belong to this specific rep
      const myLeads = leads.filter(l => l.sales_rep_id === rep.id);
      
      // Skip calculation if they have no leads (unless you want to see empty reps)
      if (myLeads.length === 0) return null;

      const last7Days = myLeads.filter(l => new Date(l.created_at) > subDays(new Date(), 7));
      const previous7Days = myLeads.filter(l => {
          const d = new Date(l.created_at);
          return d > subDays(new Date(), 14) && d <= subDays(new Date(), 7);
      });
      
      const momentum = last7Days.length - previous7Days.length; 
      const wins = myLeads.filter(l => l.customer_status === 'WON').length;
      const total = myLeads.length;
      const winRate = Math.round((wins / total) * 100);
      
      // AI Quality Score
      const highQualityLeads = myLeads.filter(l => 
          (l.tags && l.tags.includes('High Interest')) || 
          (l.notes && l.notes.includes('High Interest'))
      ).length;
      const qualityScore = Math.round((highQualityLeads / total) * 100);

      return {
          ...rep,
          totalLeads: total, 
          wins,
          winRate,
          last7DaysCount: last7Days.length,
          momentum,
          qualityScore,
          lastActivity: myLeads[0]?.created_at || null
      };
  })
  .filter(Boolean) // Remove nulls (reps with no leads)
  // 🏆 SORTING LOGIC: Put the highest momentum reps first
  .sort((a: any, b: any) => b.momentum - a.momentum);

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-zinc-900 font-sans p-8">
      
      {/* HEADER */}
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-2 uppercase italic">Sales Performance</h1>
          <p className="text-zinc-500">Live leaderboard based on activity and momentum.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl border border-zinc-200 shadow-sm text-right">
             <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Total Pipeline</div>
             {/* Simple estimation: $500 per lead value */}
             <div className="text-xl font-black text-blue-600">${(leads.length * 500).toLocaleString()} <span className="text-zinc-300 text-xs font-medium">est.</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* --- LEFT: LEADERBOARD (Sorted by Performance) --- */}
          <div className="lg:col-span-2 space-y-6">
              <h2 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-4">Rankings</h2>
              
              {repStats.map((rep: any, index: number) => (
                  <div key={rep.id} className="bg-white p-6 rounded-[2rem] border border-zinc-200 shadow-sm flex flex-col md:flex-row items-center gap-6 relative overflow-hidden group hover:border-blue-200 transition-colors">
                      
                      {/* RANK # BADGE */}
                      <div className="absolute top-4 left-4 text-xs font-black text-zinc-200">#{index + 1}</div>

                      {/* Avatar & Momentum */}
                      <div className="relative">
                          <div className="w-16 h-16 rounded-2xl bg-zinc-900 text-white flex items-center justify-center text-xl font-bold uppercase">
                              {rep.full_name?.[0] || "?"}
                          </div>
                          {/* MOMENTUM BADGE */}
                          <div className={`absolute -bottom-2 -right-2 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase border shadow-sm ${rep.momentum >= 0 ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-100'}`}>
                              {rep.momentum >= 0 ? `🔥 +${rep.momentum}` : `📉 ${rep.momentum}`} Trend
                          </div>
                      </div>

                      {/* Info */}
                      <div className="flex-1 text-center md:text-left">
                          <h3 className="text-lg font-bold text-zinc-900">{rep.full_name}</h3>
                          <div className="text-xs text-zinc-400 font-medium mt-1">
                              Last active: {rep.lastActivity ? formatDistanceToNow(new Date(rep.lastActivity)) + " ago" : "Never"}
                          </div>
                      </div>

                      {/* METRICS */}
                      <div className="flex gap-4 md:gap-8">
                          <div className="text-center">
                              <div className="text-2xl font-black text-zinc-900">{rep.winRate}%</div>
                              <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Close Rate</div>
                          </div>
                          <div className="text-center">
                              <div className="text-2xl font-black text-blue-600">{rep.qualityScore}</div>
                              <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">AI Quality</div>
                          </div>
                          <div className="text-center">
                              <div className="text-2xl font-black text-zinc-900">{rep.last7DaysCount}</div>
                              <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">7-Day Visits</div>
                          </div>
                      </div>
                  </div>
              ))}

              {repStats.length === 0 && (
                  <div className="p-12 text-center text-zinc-400 font-medium">
                      No active sales data found. <br/>
                      <span className="text-xs opacity-50">Make sure users have the 'SALES' role.</span>
                  </div>
              )}
          </div>

          {/* --- RIGHT: THE HIVE (Consolidated Activity Feed) --- */}
          <div>
              <h2 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-4">Live Field Activity</h2>
              <div className="bg-white border border-zinc-200 rounded-[2rem] p-6 h-[600px] overflow-y-auto shadow-sm relative">
                  <div className="absolute left-9 top-6 bottom-6 w-0.5 bg-zinc-100"></div>
                  <div className="space-y-6 relative z-10">
                      {leads.slice(0, 10).map((lead) => {
                          const rep = reps.find(r => r.id === lead.sales_rep_id);
                          const isHighInterest = (lead.tags || []).includes("High Interest");

                          return (
                              <div key={lead.id} className="flex gap-4 group">
                                  {/* Icon */}
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs border-2 border-white shadow-sm flex-shrink-0 z-10 ${isHighInterest ? 'bg-orange-500 text-white' : 'bg-blue-100 text-blue-600'}`}>
                                      {isHighInterest ? '🔥' : '📍'}
                                  </div>
                                  
                                  {/* Content */}
                                  <div className="pb-2 border-b border-zinc-50 w-full group-last:border-0">
                                      <div className="flex justify-between items-start">
                                          {/* THIS WILL NOW SHOW 'Sam' INSTEAD OF 'Unknown' */}
                                          <span className="text-xs font-bold text-zinc-900">{rep?.full_name?.split(' ')[0] || "Unknown"}</span>
                                          <span className="text-[9px] text-zinc-400 font-mono">{formatDistanceToNow(new Date(lead.created_at))} ago</span>
                                      </div>
                                      <div className="text-sm text-zinc-600 mt-0.5">
                                          Visited <span className="font-bold text-zinc-800">{lead.company_name}</span>
                                      </div>
                                      {isHighInterest && (
                                          <div className="mt-1 inline-block bg-orange-50 text-orange-600 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                                              High Potential
                                          </div>
                                      )}
                                  </div>
                              </div>
                          );
                      })}
                  </div>
              </div>
          </div>

      </div>
    </div>
  );
}