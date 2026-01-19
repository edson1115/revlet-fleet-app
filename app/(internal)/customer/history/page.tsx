import { redirect } from "next/navigation";
import { supabaseServerReadonly } from "@/lib/supabase/server-readonly";
import { resolveUserScope } from "@/lib/api/scope";
import ServiceHistoryClient from "./ServiceHistoryClient";

export const dynamic = "force-dynamic";

export default async function CustomerHistoryPage() {
  const scope = await resolveUserScope();
  if (!scope.uid || scope.role !== "CUSTOMER") redirect("/login");

  const supabase = await supabaseServerReadonly();

  // 1. Get Customer ID
  const { data: profile } = await supabase
    .from("profiles")
    .select("customer_id")
    .eq("id", scope.uid)
    .single();

  if (!profile?.customer_id) return <div>No Account Linked</div>;

  // 2. Fetch ALL Requests (For History)
  const { data: requests } = await supabase
    .from("service_requests")
    .select(`
      id, created_at, status, service_title, description,
      vehicle:vehicles(year, make, model, plate, unit_number)
    `)
    .eq("customer_id", profile.customer_id)
    .order("created_at", { ascending: false });

  return <ServiceHistoryClient requests={requests || []} />;
}