"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";
import clsx from "clsx";

export default function TerritoryPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeZone, setActiveZone] = useState<string>("ALL");

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchLeads = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return router.push("/login");

        const { data } = await supabase
            .from("sales_leads")
            .select("*")
            .eq("sales_rep_id", session.user.id)
            .neq("customer_status", "WON"); // Only active targets
        
        setLeads(data || []);
        setLoading(false);
    };
    fetchLeads();
  }, [router]);

  // 🧠 ZONE LOGIC: Group leads by City (Simple text match from address)
  const zones: Record<string, number> = {};
  leads.forEach(l => {
      // Mocking city extraction: assumes address format "123 Main, City, ST"
      // If no address, mark as "Unmapped"
      const city = l.address ? l.address.split(',')[1]?.trim() || "Unmapped" : "Unmapped";
      zones[city] = (zones[city] || 0) + 1;
  });

  const filteredLeads = activeZone === "ALL" 
    ? leads 
    : leads.filter(l => (l.address || "").includes(activeZone) || (activeZone === "Unmapped" && !l.address));

  if (loading) return <div className="min-h-screen bg-[#0B0F19] text-white flex items-center justify-center">Scanning Territory...</div>;

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white font-sans pb-24 selection:bg-blue-500/30">
      
      {/* HEADER */}
      <div className="p-6 pt-8 bg-[#0B0F19] sticky top-0 z-20 border-b border-white/5 shadow-xl">
         <div className="flex items-center justify-between mb-4">
             <Link href="/sales" className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1 transition-colors">
                ← DASHBOARD
             </Link>
             <div className="text-[10px] font-mono text-emerald-400 animate-pulse">
                ● LIVE TRACKING
             </div>
         </div>
         <h1 className="text-3xl font-black tracking-tight text-white uppercase italic">Territory Ops</h1>
         <p className="text-slate-500 text-xs mt-1">Plan your route. Dominate your zones.</p>
      </div>

      {/* 📡 RADAR VISUALIZER */}
      <div className="p-6 bg-blue-900/10 border-b border-white/5 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-blue-500/20 rounded-full animate-[ping_3s_linear_infinite]"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-blue-500/30 rounded-full"></div>
          <div className="relative z-10 text-center">
             <div className="text-4xl font-black text-white mb-1">{leads.length}</div>
             <div className="text-[10px] uppercase tracking-widest text-blue-300">Active Targets</div>
          </div>
      </div>

      {/* ZONE SELECTOR */}
      <div className="px-6 py-4">
          <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Select Zone</h2>
          <div className="flex gap-2 flex-wrap">
              <button 
                  onClick={() => setActiveZone("ALL")}
                  className={clsx("px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase border transition-all", activeZone === "ALL" ? "bg-white text-black border-white" : "bg-white/5 text-slate-400 border-white/10")}
              >
                  All Zones
              </button>
              {Object.entries(zones).map(([city, count]) => (
                  <button 
                      key={city}
                      onClick={() => setActiveZone(city)}
                      className={clsx("px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase border transition-all flex items-center gap-2", activeZone === city ? "bg-blue-600 text-white border-blue-500" : "bg-white/5 text-slate-400 border-white/10")}
                  >
                      {city} <span className="bg-black/30 px-1.5 rounded text-[8px]">{count}</span>
                  </button>
              ))}
          </div>
      </div>

      {/* TARGET LIST */}
      <div className="px-4 space-y-3">
          {filteredLeads.map((lead) => (
              <div key={lead.id} className="bg-white/5 border border-white/10 p-5 rounded-2xl flex items-center justify-between group active:scale-[0.98] transition-transform">
                  <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-lg border border-white/10">
                          📍
                      </div>
                      <div>
                          <div className="font-bold text-white text-sm">{lead.company_name}</div>
                          <div className="text-xs text-slate-500 max-w-[200px] truncate">
                              {lead.address || "No address on file"}
                          </div>
                      </div>
                  </div>
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.address || lead.company_name)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-900/40 transition-colors"
                  >
                      🗺️
                  </a>
              </div>
          ))}
          
          {filteredLeads.length === 0 && (
              <div className="text-center py-10 text-slate-600 text-xs">No targets in this zone.</div>
          )}
      </div>

    </div>
  );
}