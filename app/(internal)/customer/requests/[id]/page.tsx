import { notFound, redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { resolveUserScope } from "@/lib/api/scope";
import CustomerRequestClient from "./CustomerRequestClient";

export const dynamic = "force-dynamic";

// 1. Define Props for Next.js 15 (Params is a Promise)
type Props = {
  params: Promise<{ id: string }>;
};

export default async function CustomerRequestPage({ params }: Props) {
  // 2. AWAIT the params to get the ID
  const { id } = await params;

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  );

  const scope = await resolveUserScope();

  if (!scope.uid || scope.role !== 'CUSTOMER') {
    redirect("/login");
  }

  // 3. Fetch Data using the awaited 'id'
  const { data: request, error } = await supabase
    .from("service_requests")
    .select(`
      id,
      service_title,
      service_description,
      description,
      status,
      created_at,
      scheduled_start_at,
      started_at,
      completed_at,
      technician_notes,
      vehicle:vehicles (
        year,
        make,
        model,
        plate,
        vin
      ),
      technician:profiles!technician_id (
        full_name,
        email
      ),
      request_images (
        id,
        url_full,
        created_at,
        kind
      )
    `)
    .eq("id", id)
    .single();

  if (error || !request) {
    console.error("Request Fetch Error:", error);
    return notFound();
  }

  return <CustomerRequestClient request={request} />;
}