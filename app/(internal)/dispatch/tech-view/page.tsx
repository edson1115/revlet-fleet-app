import { redirect } from "next/navigation";
import { supabaseServerReadonly } from "@/lib/supabase/server-readonly";
import TechDashboardClient from "@/app/(internal)/tech/TechDashboardClient";

export const dynamic = "force-dynamic";

export default async function VirtualTechPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>; 
}) {
  const supabase = await supabaseServerReadonly();

  // 1. Auth Check (Must be Office/Admin)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: currentUserProfile } = await supabase
    .from("profiles")
    .select("role, permissions")
    .eq("id", user.id)
    .single();

  const isAuthorized = 
    currentUserProfile?.role === 'OFFICE' || 
    currentUserProfile?.role === 'SUPERADMIN' || 
    currentUserProfile?.permissions?.access_dispatch === true;

  if (!isAuthorized) redirect("/no-access");

  // 2. Identify Target Tech
  const params = await searchParams;
  const targetTechId = params.id;

  if (!targetTechId) {
    return (
        <div className="min-h-screen bg-[#F4F5F7] flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md border border-zinc-200">
                <div className="text-4xl mb-4">🕵️‍♂️</div>
                <h1 className="text-xl font-black text-zinc-900 mb-2">Select a Technician</h1>
                <p className="text-zinc-500 mb-6 text-sm">Please select a technician from the Dispatch Roster to view their dashboard.</p>
                <a href="/dispatch" className="bg-black text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-zinc-800">Return to Dispatch</a>
            </div>
        </div>
    );
  }

  // 3. Fetch Target Tech's Profile
  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", targetTechId)
    .single();

  // ✅ 4. FETCH TARGET TECH'S XP
  const { data: xpStats } = await supabase
    .from("user_xp_stats")
    .select("total_xp")
    .eq("user_id", targetTechId)
    .single();

  // 5. Fetch Target Tech's Jobs
  const { data: requests, error } = await supabase
    .from("service_requests")
    .select(`
      id,
      status,
      created_at,
      service_title,
      scheduled_start_at,
      technician_id,
      second_technician_id,
      customer:customers(name, address),
      vehicle:vehicles(year, make, model, plate, unit_number),
      request_parts(id, part_name, part_number, quantity)
    `)
    .or(`technician_id.eq.${targetTechId},second_technician_id.eq.${targetTechId}`)
    .in("status", ["SCHEDULED", "IN_PROGRESS", "RESCHEDULE_PENDING"])
    .order("scheduled_start_at", { ascending: true });

  if (error) console.error("Virtual Tech Load Error:", error);

  // 6. Render the Tech Client in "Mirror Mode"
  return (
    <div className="relative">
        {/* Banner to remind Office User they are in View Mode */}
        <div className="bg-indigo-600 text-white text-center py-2 text-xs font-bold uppercase tracking-widest sticky top-0 z-50 shadow-md flex justify-center items-center gap-4">
            <span>👀 Viewing as {targetProfile?.full_name || "Unknown Tech"}</span>
            <a href="/dispatch" className="bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded text-[10px] transition">Exit View ✕</a>
        </div>
        
        <TechDashboardClient 
            requests={requests || []} 
            userId={targetTechId} 
            userName={targetProfile?.full_name || "Technician"} 
            currentXp={xpStats?.total_xp || 0} // 👈 Pass the XP
        />
    </div>
  );
}