import { redirect } from "next/navigation";
import { supabaseServerReadonly } from "@/lib/supabase/server-readonly";
import DispatchDashboardClient from "./DispatchDashboardClient";

export const dynamic = "force-dynamic";

export default async function DispatchPage() {
  const supabase = await supabaseServerReadonly();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 1. Check Role & Permissions
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, permissions")
    .eq("id", user.id)
    .single();

  const isOffice = 
    profile?.role === 'OFFICE' || 
    profile?.role === 'SUPERADMIN' || 
    user.email === 'office@test.com' ||
    profile?.permissions?.access_dispatch === true;

  // ✅ NEW: Check if they are allowed to see the Tech App
  const canAccessTech = 
    profile?.role === 'TECHNICIAN' || 
    profile?.role === 'TECH' || 
    profile?.permissions?.access_tech_app === true;

  // 2. Fetch Requests
  const { data: requests, error } = await supabase
    .from("service_requests")
    .select(`
      id, created_at, status, service_title, description, service_description, technician_notes,
      customer:customers(name),
      vehicle:vehicles(year, make, model, plate, vin),
      technician:profiles!technician_id(full_name), 
      second_technician:profiles!second_technician_id(full_name)
    `)
    .neq("status", "NEW")
    .neq("status", "COMPLETED")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) console.error("Dispatch fetch error:", error);

  // 3. Fetch Techs
  const { data: technicians } = await supabase
    .from("profiles")
    .select("id, full_name, current_shift_start") 
    .in("role", ["TECHNICIAN", "TECH"])
    .eq("active", true)
    .order("full_name");

  const list = requests || [];

  const stats = {
    unassigned: list.filter((r) => r.status === "READY_TO_SCHEDULE").length,
    scheduled: list.filter((r) => r.status === "SCHEDULED").length,
    inProgress: list.filter((r) => r.status === "IN_PROGRESS").length,
    atRisk: list.filter((r) => r.status === "ATTENTION_REQUIRED" || r.status === "WAITING_APPROVAL" || r.status === "RESCHEDULE_PENDING").length,
  };

  return (
    <DispatchDashboardClient 
      requests={list} 
      stats={stats} 
      isOffice={isOffice}
      canAccessTech={canAccessTech} // 👈 Passing the permission
      technicians={technicians || []} 
    />
  );
}