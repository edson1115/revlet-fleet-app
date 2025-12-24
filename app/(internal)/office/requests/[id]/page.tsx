import OfficeRequestDetailClient from "./OfficeRequestDetailClient";
import { supabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function OfficeRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!id) redirect("/office/requests");

  const supabase = await supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: request, error } = await supabase
    .from("requests")
    .select(
      `
      id,
      status,
      service,
      notes,
      created_at,
      scheduled_start_at,
      scheduled_end_at,
      technician_id,
      completed_at,
      completed_by_role,
      created_by_role,

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
        unit_number
      )
    `
    )
    .eq("id", id)
    .single();

  if (error || !request) {
    redirect("/office/requests");
  }

  return (
    <OfficeRequestDetailClient
      request={{
        ...request,
        service_title: request.service ?? "",
        service_description: request.notes ?? "",
      }}
    />
  );
}
