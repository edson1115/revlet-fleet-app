import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";
import TechDashboardClient from "./TechDashboardClient";

export const dynamic = "force-dynamic";

export default async function TechPage() {
  const scope = await resolveUserScope();
  if (!scope.uid) redirect("/login");

  const supabase = await supabaseServer();

  // Fetch jobs WITH parts data
  const { data: requests } = await supabase
    .from("service_requests")
    .select(`
      id,
      status,
      created_at,
      service_title,
      scheduled_start_at,
      customer:customers(name, address),
      vehicle:vehicles(year, make, model, plate, unit_number),
      request_parts(id, part_name, part_number, quantity, vendor)  // <--- ADDED THIS
    `)
    .in("status", ["READY_TO_SCHEDULE", "SCHEDULED", "IN_PROGRESS"])
    .order("created_at", { ascending: false });

  return <TechDashboardClient requests={requests || []} />;
}