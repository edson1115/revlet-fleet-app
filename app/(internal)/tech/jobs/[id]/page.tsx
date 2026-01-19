import { redirect } from "next/navigation";
import { supabaseServerReadonly } from "@/lib/supabase/server-readonly";
import { resolveUserScope } from "@/lib/api/scope";
import TechJobDetailClient from "./TechJobDetailClient";

export const dynamic = "force-dynamic";

export default async function TechJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const scope = await resolveUserScope();
  
  if (!scope.uid) redirect("/login");

  const supabase = await supabaseServerReadonly();

  // Fetch Full Job Details
  const { data: request, error } = await supabase
    .from("service_requests")
    .select(`
      *,
      customer:customers(name, address, phone),
      vehicle:vehicles(year, make, model, plate, unit_number, vin),
      request_parts(id, part_name, part_number, quantity),
      request_images(id, url_full, kind)
    `)
    .eq("id", id)
    .single();

  if (error || !request) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Job Not Found</h1>
          <a href="/tech" className="text-blue-500 underline">Back to Dashboard</a>
        </div>
      </div>
    );
  }

  return <TechJobDetailClient request={request} userId={scope.uid} />;
}