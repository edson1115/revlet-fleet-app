import { redirect } from "next/navigation";
import { supabaseServerReadonly } from "@/lib/supabase/server-readonly";
import { resolveUserScope } from "@/lib/api/scope";
import OfficeDashboardClient from "./OfficeDashboardClient";

export const dynamic = "force-dynamic";

export default async function OfficeHomePage() {
  const scope = await resolveUserScope();

  // 1. Auth & Role Check
  const ok = !!scope.uid && (scope.role === "OFFICE" || scope.role === "ADMIN" || scope.role === "DISPATCH");
  if (!ok) redirect("/login");

  const supabase = await supabaseServerReadonly();

  // 2. Fetch Data (✅ ADDED missing note columns)
  const { data: requests, error } = await supabase
    .from("service_requests")
    .select(`
      id,
      created_at,
      status,
      service_title,
      description,
      service_description,
      technician_notes, 
      notes_internal,
      created_by_role,
      customer:customers(name, approval_type),
      vehicle:vehicles(year, make, model, plate, vin)
    `)
    .order("created_at", { ascending: false })
    .limit(250);

  if (error) {
    console.error("Office requests fetch error:", error);
  }

  const list = requests || [];

  // 3. Calc Stats
  const stats = {
    unassigned: list.filter((r: any) => r.status === "NEW").length,
    scheduled: list.filter((r: any) => r.status === "SCHEDULED" || r.status === "READY_TO_SCHEDULE").length,
    inProgress: list.filter((r: any) => r.status === "IN_PROGRESS").length,
    attention: list.filter((r: any) => r.status === "ATTENTION_REQUIRED" || r.status === "WAITING_APPROVAL").length,
  };

  return <OfficeDashboardClient requests={list} stats={stats} />;
}