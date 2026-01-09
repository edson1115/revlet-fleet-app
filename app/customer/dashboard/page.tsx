"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/client";
import { getCustomerProfile } from "@/app/actions/customer"; // Import the profile action
import clsx from "clsx";

import { TeslaServiceCard } from "@/components/tesla/TeslaServiceCard";
import { TeslaSection } from "@/components/tesla/TeslaSection";
import { TeslaDivider } from "@/components/tesla/TeslaDivider";

export default function CustomerDashboard() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null); // New state for profile
  const [recentRequests, setRecentRequests] = useState<any[]>([]);

  async function load() {
    try {
      // Parallel fetch for stats and profile verification
      const [dashRes, profileData] = await Promise.all([
        fetch("/api/customer/dashboard", { cache: "no-store" }),
        getCustomerProfile()
      ]);

      const js = await dashRes.json();
      if (!dashRes.ok) throw new Error(js.error || "Dashboard failed");

      setStats(js.stats);
      setRecentRequests(js.recent_requests);
      setProfile(profileData);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const supabase = supabaseBrowser();
    const channel = supabase.channel("customer_dashboard_updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "service_requests" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  if (loading) return <div className="p-12 text-zinc-400 font-bold uppercase tracking-widest text-[10px] animate-pulse">Loading Fleet Intelligence…</div>;
  if (err) return <div className="p-12 text-orange-600 font-black italic uppercase">Error: {err}</div>;

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-10 selection:bg-black selection:text-white">
      
      {/* 👤 ACCOUNT VERIFICATION LAYER (New Section) */}
      {profile && (
        <div className="bg-zinc-50 border border-zinc-200 rounded-[2rem] p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 animate-in fade-in slide-in-from-top-4">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-zinc-900 leading-none">
              {profile.company_name}
            </h2>
            <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mt-2">
              Account Primary: {profile.contact_name}
            </p>
          </div>

          <div className="flex flex-wrap gap-10">
            <div className="space-y-1">
              <p className="text-[9px] font-black uppercase text-zinc-400 tracking-[0.2em]">Service Phone</p>
              <p className="font-bold text-zinc-900 text-sm">{profile.phone || "Not Set"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-black uppercase text-zinc-400 tracking-[0.2em]">Billing Address</p>
              <p className="font-bold text-zinc-900 text-sm leading-tight max-w-[200px]">
                {profile.billing_address || "No Address on File"}
              </p>
            </div>
          </div>

          <button className="bg-white border border-zinc-200 px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-zinc-100 transition-all active:scale-95 shadow-sm">
            Update Info
          </button>
        </div>
      )}

      <div className="flex justify-between items-end pt-4">
        <div>
          <h1 className="text-4xl font-black italic tracking-tighter uppercase mb-1">Fleet Command</h1>
          <p className="text-zinc-500 text-sm font-medium tracking-tight">Real-time overview of your fleet activity and health.</p>
        </div>
        <Link href="/customer/request" className="bg-black text-white px-6 py-4 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:scale-105 transition-all active:scale-95">
          🚀 New Service Request
        </Link>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <TeslaServiceCard title="Fleet Size">
          <div className="text-3xl font-black tracking-tighter">{stats.vehicles}</div>
        </TeslaServiceCard>
        <TeslaServiceCard title="Active Jobs">
          <div className={clsx("text-3xl font-black tracking-tighter", stats.active_requests > 0 ? "text-blue-600" : "text-zinc-900")}>
            {stats.active_requests}
          </div>
        </TeslaServiceCard>
        <TeslaServiceCard title="Total Requests">
          <div className="text-3xl font-black tracking-tighter text-zinc-400">{stats.total_requests}</div>
        </TeslaServiceCard>
        <TeslaServiceCard title="30D Completion">
          <div className="text-3xl font-black tracking-tighter text-green-500">{stats.completed_30days}</div>
        </TeslaServiceCard>
      </div>

      <TeslaDivider />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* RECENT REQUESTS - Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <TeslaSection title="Recent Activity">
            <div className="space-y-3 mt-4">
              {recentRequests.length === 0 ? (
                <div className="text-sm font-bold text-zinc-300 italic">No recent service activity recorded.</div>
              ) : (
                recentRequests.map((r) => (
                  <div key={r.id} className="border border-zinc-100 rounded-[1.5rem] p-5 bg-white flex justify-between items-center group hover:border-black transition-all">
                    <div>
                      <div className="text-lg font-black tracking-tight leading-none mb-1">
                        {r.vehicle?.year} {r.vehicle?.make} {r.vehicle?.model}
                      </div>
                      <div className="flex gap-2 items-center">
                        <span className="text-[9px] font-black uppercase bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded italic">
                          {r.service || "General Maintenance"}
                        </span>
                        <span className={clsx(
                          "text-[9px] font-black uppercase px-2 py-0.5 rounded",
                          r.status === "COMPLETED" ? "bg-green-50 text-green-600" : "bg-blue-50 text-blue-600"
                        )}>
                          {r.status}
                        </span>
                      </div>
                    </div>
                    <Link href={`/customer/requests/${r.id}`} className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all">
                      →
                    </Link>
                  </div>
                ))
              )}
            </div>
          </TeslaSection>
        </div>

        {/* FMC GROUPING - Right Column */}
        <div className="space-y-6">
          <TeslaSection title="Fleet by FMC">
            <div className="mt-4 space-y-2">
              {!stats.fmc_groups || stats.fmc_groups.length === 0 ? (
                <div className="text-sm font-bold text-zinc-300 italic">No FMC data found.</div>
              ) : (
                stats.fmc_groups.map((g: any) => (
                  <div key={g.fmc} className="flex justify-between items-center border border-zinc-100 rounded-2xl p-4 bg-zinc-50/50">
                    <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{g.fmc || "Private Fleet"}</div>
                    <div className="text-lg font-black tracking-tighter">{g.count}</div>
                  </div>
                ))
              )}
              <Link href="/customer/vehicles" className="block text-center text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-800 transition pt-2">
                Manage All Vehicles →
              </Link>
            </div>
          </TeslaSection>
        </div>
      </div>
    </div>
  );
}