import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";
import DispatchBoardClient from "./DispatchBoardClient";

export const dynamic = "force-dynamic";

export default async function DispatchPage() {
  const scope = await resolveUserScope();
  if (!scope.uid) redirect("/login");

  if (!["ADMIN", "DISPATCH", "OFFICE", "SUPERADMIN"].includes(scope.role)) {
    return <div className="p-10">Access Denied</div>;
  }

  const supabase = await supabaseServer();

  // ✅ FETCH REQUESTS WITH PARTS & BOTH TECHS
  const { data: requests, error } = await supabase
    .from("service_requests")
    .select(`
      id,
      status,
      service_title,
      created_at,
      scheduled_start_at,
      technician_id,
      second_technician_id,  
      office_notes,
      customer:customers(name, address),
      vehicle:vehicles(year, make, model, plate, unit_number),
      tech:profiles!technician_id(full_name),
      buddy:profiles!second_technician_id(full_name),
      request_parts(id, part_name, part_number, quantity)
    `)
    .neq("status", "COMPLETED") 
    .order("created_at", { ascending: false });

  if (error) console.error("Dispatch Load Error:", error);

  // ✅ FETCH TECH LIST
  const { data: techs } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("role", "TECH")
    .eq("active", true);

  return <DispatchBoardClient initialRequests={requests || []} technicians={techs || []} />;
}