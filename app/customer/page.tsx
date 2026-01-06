import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";
import CustomerDashboardClient from "./CustomerDashboardClient";
import CustomerError from "./CustomerError";

export const dynamic = "force-dynamic";

export default async function CustomerPage() {
  const scope = await resolveUserScope();
  
  if (!scope.uid || scope.role !== "CUSTOMER") {
      redirect("/login");
  }

  const supabase = await supabaseServer();

  // 1. SIMPLE FETCH (No Joins - Bulletproof)
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("customer_id")
    .eq("id", scope.uid)
    .single();

  // 2. ERROR HANDLING: Capture the REAL error
  if (profileError || !profile?.customer_id) {
      return (
        <CustomerError 
            userId={scope.uid} 
            email={scope.email} 
            sysError={profileError ? profileError.message : "Profile found, but customer_id is NULL"} 
        />
      );
  }

  // 3. GET CUSTOMER NAME (Separate fetch to be safe)
  const { data: customer } = await supabase
    .from("customers")
    .select("name")
    .eq("id", profile.customer_id)
    .single();

  // 4. FETCH REQUESTS
  const { data: requests, error: reqError } = await supabase
    .from("service_requests")
    .select(`
      id,
      created_at,
      status,
      service_title,
      vehicle:vehicles(year, make, model, plate)
    `)
    .eq("customer_id", profile.customer_id)
    .order("created_at", { ascending: false });

  if (reqError) console.error("Request Fetch Error:", reqError);

  return (
    <CustomerDashboardClient 
        requests={requests || []} 
        customerName={customer?.name || "Valued Client"} 
    />
  );
}