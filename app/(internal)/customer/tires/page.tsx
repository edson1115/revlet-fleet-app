import { redirect } from "next/navigation";
import { supabaseServerReadonly } from "@/lib/supabase/server-readonly";
import { resolveUserScope } from "@/lib/api/scope";
import TiresClient from "./TiresClient";

export const dynamic = "force-dynamic";

export default async function TireOrdersPage() {
  const scope = await resolveUserScope();
  if (!scope.uid) redirect("/login");

  const supabase = await supabaseServerReadonly();

  // 1. Get Customer ID
  const { data: profile } = await supabase
    .from("profiles")
    .select("customer_id")
    .eq("id", scope.uid)
    .single();

  if (!profile?.customer_id) return <div>Error: No Fleet Account</div>;

  // 2. Fetch Tire Requests (FIXED QUERY)
  const { data: orders } = await supabase
    .from("service_requests")
    .select(`
      id, created_at, status, service_title, description, technician_notes,
      vehicle:vehicles(year, make, model, plate)
    `)
    .eq("customer_id", profile.customer_id)
    .ilike("service_title", "Tire Purchase%") // <--- CHANGED from .eq to .ilike
    .order("created_at", { ascending: false });

  // 3. Fetch Vehicles
  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("id, year, make, model, plate")
    .eq("customer_id", profile.customer_id)
    .order("year", { ascending: false });

  return <TiresClient orders={orders || []} vehicles={vehicles || []} customerId={profile.customer_id} />;
}