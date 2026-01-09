import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";
import TechJobClient from "./TechJobClient";

export default async function TechJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const scope = await resolveUserScope();
  
  if (!scope.uid) redirect("/login");

  const supabase = await supabaseServer();

  // ✅ Fetch Job + Parts + Snapshot Plate
  const { data: request, error } = await supabase
    .from("service_requests")
    .select(`
      *,
      plate, 
      customer:customers(name, address, phone),
      vehicle:vehicles(year, make, model, vin, plate, unit_number),
      request_parts(id, part_name, part_number, quantity)
    `)
    .eq("id", id)
    .single();

  if (error || !request) {
    return <div>Job Not Found</div>;
  }

  return <TechJobClient request={request} />;
}