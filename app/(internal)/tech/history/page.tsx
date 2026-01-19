import { redirect } from "next/navigation";
import { supabaseServerReadonly } from "@/lib/supabase/server-readonly";
import { resolveUserScope } from "@/lib/api/scope";
import TechHistoryClient from "./TechHistoryClient";

export const dynamic = "force-dynamic";

export default async function TechHistoryPage() {
  const scope = await resolveUserScope();
  if (!scope.uid) redirect("/login");

  const supabase = await supabaseServerReadonly();

  // Fetch Completed Jobs for this Tech
  const { data: jobs } = await supabase
    .from("service_requests")
    .select(`
      id, created_at, status, service_title, completed_at,
      customer:customers(name),
      vehicle:vehicles(year, make, model, plate)
    `)
    .or(`technician_id.eq.${scope.uid},second_technician_id.eq.${scope.uid}`)
    .eq("status", "COMPLETED")
    .order("completed_at", { ascending: false })
    .limit(50); // Last 50 jobs

  return <TechHistoryClient jobs={jobs || []} />;
}