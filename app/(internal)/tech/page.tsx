import { redirect } from "next/navigation";
import { supabaseServerReadonly } from "@/lib/supabase/server-readonly";
import { resolveUserScope } from "@/lib/api/scope";
import TechDashboardClient from "./TechDashboardClient";

export const dynamic = "force-dynamic";

export default async function TechPage() {
  const scope = await resolveUserScope();
  if (!scope.uid) redirect("/login");

  const supabase = await supabaseServerReadonly();

  // 1. Fetch Tech Profile (Name)
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", scope.uid)
    .single();

  // 2. Fetch Active Jobs
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
      customer:customers(name),
      vehicle:vehicles(year, make, model, plate, unit_number),
      request_parts(id)
    `)
    .or(`technician_id.eq.${scope.uid},second_technician_id.eq.${scope.uid}`)
    .in("status", ["SCHEDULED", "IN_PROGRESS"])
    .order("scheduled_start_at", { ascending: true });

  if (error) console.error("Tech Load Error:", error);

  return (
    <TechDashboardClient 
      requests={requests || []} 
      userId={scope.uid} 
      userName={profile?.full_name || "Technician"} 
    />
  );
}