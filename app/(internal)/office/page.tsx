import { redirect } from "next/navigation";
import { supabaseServerReadonly } from "@/lib/supabase/server-readonly";
import OfficeDashboardClient from "./OfficeDashboardClient";

export const dynamic = "force-dynamic";

export default async function OfficeDashboardPage() {
  // ✅ 1. Get READ-ONLY client INSIDE the request
  const supabase = await supabaseServerReadonly();

  // ✅ 2. Verify Auth (READ ONLY is OK)
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  // ✅ 3. Fetch Data
  const { data: requests, error: dbError } = await supabase
    .from("service_requests")
    .select(`
      id,
      created_at,
      status,
      service_title,
      created_by_role,
      plate,
      customer:customers(name),
      vehicle:vehicles(year, make, model, plate, unit_number)
    `)
    .order("created_at", { ascending: false });

  if (dbError) {
    console.error("Dashboard Fetch Error:", dbError.message);
  }

  // ✅ 4. Render client component
  return <OfficeDashboardClient requests={requests || []} />;
}