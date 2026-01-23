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
  // ⚠️ FIXED: Changed 'name' to 'company_name' to match your database
  const { data: profile } = await supabase
    .from("profiles")
    .select("customer_id, customers(company_name)")
    .eq("id", scope.uid)
    .single();

  // 2. Gatekeeper: If no link, show the error UI
  if (!profile?.customer_id) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F4F5F7] font-sans text-zinc-900">
            <div className="bg-white p-12 rounded-3xl shadow-xl border border-zinc-200 text-center max-w-sm">
                <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">🚫</div>
                <h2 className="text-xl font-black uppercase tracking-tight mb-2">Account Not Linked</h2>
                <p className="text-zinc-500 text-sm font-medium leading-relaxed">
                    Your user profile is active, but it hasn't been connected to a fleet account yet.
                </p>
                <div className="mt-6 text-xs font-bold text-zinc-400 bg-zinc-50 py-2 px-4 rounded-lg">
                    System ID: {scope.uid.slice(0, 8)}...
                </div>
            </div>
        </div>
      );
  }

  // 3. Fetch Active Requests for this Fleet
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
    .neq("status", "COMPLETED") 
    .order("created_at", { ascending: false });

  return (
    <CustomerDashboardClient 
       requests={requests || []} 
       // ⚠️ FIXED: Mapping the correct column name
       customerName={profile.customers?.company_name || "My Fleet"} 
    />
  );
}