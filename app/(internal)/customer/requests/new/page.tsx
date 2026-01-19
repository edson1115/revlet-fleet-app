import { redirect } from "next/navigation";
import { supabaseServerReadonly } from "@/lib/supabase/server-readonly";
import { resolveUserScope } from "@/lib/api/scope";
import NewRequestClient from "./NewRequestClient";

export const dynamic = "force-dynamic";

export default async function NewRequestPage() {
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

  // 2. Fetch Fleet Vehicles (For the dropdown)
  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("id, year, make, model, plate, vin")
    .eq("customer_id", profile.customer_id)
    .order("year", { ascending: false });

  return <NewRequestClient customerId={profile.customer_id} vehicles={vehicles || []} />;
}