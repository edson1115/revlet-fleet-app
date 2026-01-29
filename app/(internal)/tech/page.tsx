import { redirect } from "next/navigation";
import { supabaseServerReadonly } from "@/lib/supabase/server-readonly";
import TechDashboardClient from "./TechDashboardClient";

export const dynamic = "force-dynamic";

export default async function TechPage() {
  const supabase = await supabaseServerReadonly();

  // 1. Standard Auth Check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 2. Fetch Profile & Permissions
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, permissions")
    .eq("id", user.id)
    .single();

  // 3. Access Check
  const hasAccess = 
      profile?.role === 'TECHNICIAN' || 
      profile?.role === 'TECH' || 
      profile?.role === 'SUPERADMIN' || 
      user.email === 'office@test.com' || 
      profile?.permissions?.access_tech_app === true;

  if (!hasAccess) {
      redirect("/no-access");
  }

  // ✅ 4. FETCH XP STATS
  const { data: xpStats } = await supabase
    .from("user_xp_stats")
    .select("total_xp")
    .eq("user_id", user.id)
    .single();

  // 5. Fetch Active Jobs
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
    .or(`technician_id.eq.${user.id},second_technician_id.eq.${user.id}`)
    .in("status", ["SCHEDULED", "IN_PROGRESS", "RESCHEDULE_PENDING"])
    .order("scheduled_start_at", { ascending: true });

  if (error) console.error("Tech Load Error:", error);

  return (
    <TechDashboardClient 
      requests={requests || []} 
      userId={user.id} 
      userName={profile?.full_name || "Technician"}
      currentXp={xpStats?.total_xp || 0} // 👈 Pass the XP
    />
  );
}