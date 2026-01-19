import { redirect } from "next/navigation";
import { supabaseServerReadonly } from "@/lib/supabase/server-readonly";
import { resolveUserScope } from "@/lib/api/scope";
import CustomerDashboardClient from "./CustomerDashboardClient";

export const dynamic = "force-dynamic";

export default async function CustomerPage() {
  const scope = await resolveUserScope();
  if (!scope.uid) redirect("/login");

  const supabase = await supabaseServerReadonly();

  // 1. Get Customer ID linked to this User
  const { data: profile } = await supabase
    .from("profiles")
    .select("customer_id, customers(name)")
    .eq("id", scope.uid)
    .single();

  if (!profile?.customer_id) {
      return <div className="p-10 text-center">No Fleet Account Linked. Please contact support.</div>;
  }

  // 2. Fetch Active Requests for this Fleet
  // ✅ ADDED: technician_notes
  const { data: requests } = await supabase
    .from("service_requests")
    .select(`
      id, 
      status, 
      service_title, 
      created_at, 
      scheduled_start_at,
      technician_notes,
      vehicle:vehicles(year, make, model, plate, unit_number),
      technician:profiles!technician_id(full_name)
    `)
    .eq("customer_id", profile.customer_id)
    .neq("status", "COMPLETED") // Active only
    .order("created_at", { ascending: false });

  return (
    <CustomerDashboardClient 
       requests={requests || []} 
       customerName={profile.customers?.name || "My Fleet"} 
    />
  );
}