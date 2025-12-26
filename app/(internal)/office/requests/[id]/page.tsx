import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";
import OfficeRequestDetailClient from "./OfficeRequestDetailClient";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function OfficeRequestDetailPage({ params }: PageProps) {
  const { id } = await params;

  if (!id) {
    redirect("/office/requests");
  }

  const scope = await resolveUserScope();

  if (!scope.uid) {
    redirect("/login");
  }

  const supabase = await supabaseServer();

  const { data: request, error } = await supabase
    .from("service_requests")
    .select(`
      *,
      customer:customers (
        id,
        name
      ),
      vehicle:vehicles (
        id,
        year,
        make,
        model,
        plate,
        unit_number,
        vin,
        provider_companies ( name )
      ),
      tech:profiles!service_requests_technician_id_fkey (
        id,
        full_name
      ),
      request_images (
        id,
        url_full
      )
    `)
    .eq("id", id)
    .maybeSingle();

  // Redirect if not found (standard behavior)
  if (error || !request) {
    redirect("/office/requests");
  }

  return <OfficeRequestDetailClient request={request} />;
}