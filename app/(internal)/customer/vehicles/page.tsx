import { redirect } from "next/navigation";
import { supabaseServerReadonly } from "@/lib/supabase/server-readonly";
import { resolveUserScope } from "@/lib/api/scope";
import VehiclesClient from "./VehiclesClient";

export const dynamic = "force-dynamic";

export default async function VehiclesPage() {
  const scope = await resolveUserScope();
  if (!scope.uid) redirect("/login");

  const supabase = await supabaseServerReadonly();

  // 1. Get Customer ID
  const { data: profile } = await supabase
    .from("profiles")
    .select("customer_id")
    .eq("id", scope.uid)
    .single();

  if (!profile?.customer_id) return <div>No Fleet Linked</div>;

  // 2. Fetch Vehicles
  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("*")
    .eq("customer_id", profile.customer_id)
    .order("year", { ascending: false });

  // ✅ PASS customerId to the client so we can add new vehicles
  return <VehiclesClient vehicles={vehicles || []} customerId={profile.customer_id} />;
}