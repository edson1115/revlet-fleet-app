import { notFound, redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";
import TechRequestDetailClient from "./TechRequestDetailClient";

export const dynamic = "force-dynamic";

export default async function TechRequestDetailPage({ params }: { params: any }) {
  const { id } = await params;
  const scope = await resolveUserScope();
  if (!scope.uid) redirect("/login");

  const supabase = await supabaseServer();

  // Fetch Full Request Data
  const { data: request } = await supabase
    .from("service_requests")
    .select(`
      *,
      customer:customers(name, address, phone),
      vehicle:vehicles(year, make, model, plate, unit_number, vin),
      request_parts(*)
    `)
    .eq("id", id)
    .single();

  if (!request) return notFound();

  return <TechRequestDetailClient request={request} />;
}