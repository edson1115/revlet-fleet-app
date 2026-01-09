import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";
import TechDashboardClient from "./TechDashboardClient";

export const dynamic = "force-dynamic";

export default async function TechPage() {
  const scope = await resolveUserScope();
  if (!scope.uid) redirect("/login");

  const supabase = await supabaseServer();

  // 1. Fetch Active Jobs (SCHEDULED or IN_PROGRESS)
  // 2. Filter: Assigned as Lead OR Buddy
  // 3. Include: Snapshot Plate & Parts
  const { data: requests, error } = await supabase
    .from("service_requests")
    .select(`
      id,
      status,
      created_at,
      service_title,
      scheduled_start_at,
      plate, 
      customer:customers(name, address),
      vehicle:vehicles(year, make, model, plate, unit_number),
      request_parts(id, part_name, part_number, quantity) 
    `)
    .or(`technician_id.eq.${scope.uid},second_technician_id.eq.${scope.uid}`) // Check both columns
    .in("status", ["SCHEDULED", "IN_PROGRESS"]) 
    .order("scheduled_start_at", { ascending: true });

  if (error) {
    console.error("Tech Fetch Error:", error);
  }

  return <TechDashboardClient requests={requests || []} />;
}