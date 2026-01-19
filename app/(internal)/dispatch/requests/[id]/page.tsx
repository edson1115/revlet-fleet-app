import { redirect } from "next/navigation";
import { supabaseServerReadonly } from "@/lib/supabase/server-readonly";
import DispatcherRequestDetailClient from "./DispatcherRequestDetailClient";

export const dynamic = "force-dynamic";

export default async function DispatchRequestPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  const supabase = await supabaseServerReadonly();

  // 1. Auth Check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 2. Fetch Full Request Detail (✅ ADDED: scheduled_at)
  const { data: request, error } = await supabase
    .from("service_requests")
    .select(`
      *,
      scheduled_at, 
      customer:customers(*),
      vehicle:vehicles(*),
      technician:technician_id(full_name),
      second_technician:second_technician_id(full_name),
      request_parts(*),
      request_images(*)
    `)
    .eq("id", id)
    .single();

  if (error || !request) {
    return <div className="p-10 text-center">Request not found.</div>;
  }

  // 3. Fetch Tech List
  const { data: techs } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .in("role", ["TECHNICIAN", "TECH"])
    .eq("active", true)
    .order("full_name");

  return (
    <DispatcherRequestDetailClient 
      request={request} 
      technicians={techs || []} 
    />
  );
}