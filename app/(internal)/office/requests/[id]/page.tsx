import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import OfficeRequestDetailClient from "./OfficeRequestDetailClient";

export const dynamic = "force-dynamic";

export default async function OfficeRequestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params; // ✅ REQUIRED in Next.js 15
  const supabase = await supabaseServer();

  /* ----------------------------------
     AUTH
  ---------------------------------- */
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) notFound();

  /* ----------------------------------
     LOAD REQUEST
  ---------------------------------- */
  const { data: request, error } = await supabase
    .from("service_requests")
    .select(
      `
      id,
      type,
      status,
      urgent,
      service,
      po,
      notes,
      dropoff_address,
      dispatch_notes,
      tire_size,
      tire_quantity,
      scheduled_start_at,
      scheduled_end_at,
      created_at,

      approval_number,
      invoice_number,
      office_notes,

      vehicle:vehicles (
        id,
        year,
        make,
        model,
        plate,
        unit_number,
        vin,
        last_reported_mileage,
        mileage_override,
        market
      ),

      customer:customers (
        id,
        name
      ),

      parts:service_request_parts (
        id,
        part_number,
        description,
        quantity
      ),

      timeline:service_request_notes (
        id,
        role,
        note,
        created_at
      )
    `
    )
    .eq("id", id)
    .single();

  if (error || !request) {
    console.error("Office request load failed:", error);
    notFound();
  }

  return (
    <div className="space-y-4">
      {/* ================= BACK NAV ================= */}
      <div>
        <Link
          href="/office/requests"
          className="inline-flex items-center text-sm text-gray-600 hover:text-black transition"
        >
          ← Back to Office Requests
        </Link>
      </div>

      {/* ================= DETAIL ================= */}
      <OfficeRequestDetailClient request={request} />
    </div>
  );
}
