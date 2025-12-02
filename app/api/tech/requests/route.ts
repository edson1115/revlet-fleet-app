// app/api/tech/requests/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  const supabase = supabaseServer();
  const scope = await resolveUserScope();

  // Must be TECH role
  if (!scope.isTech || !scope.uid) {
    return NextResponse.json(
      { error: "Forbidden — tech only" },
      { status: 403 }
    );
  }

  // ---------------------------------------------------------
  // Pull technician’s scheduled jobs
  // ---------------------------------------------------------
  const { data, error } = await supabase
    .from("service_requests")
    .select(
      `
        id,
        status,
        service,
        dispatch_notes,
        scheduled_at,
        created_at,

        vehicle:vehicles (
          id,
          year,
          make,
          model,
          plate,
          unit_number
        ),

        customer:customers (
          id,
          name
        ),

        location:locations (
          id,
          name
        )
      `
    )
    .eq("technician_id", scope.uid)
    .order("scheduled_at", { ascending: true });

  if (error) {
    console.error("Tech requests error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  // ---------------------------------------------------------
  // Normalize results
  // Tesla UI expects a flat structure
  // ---------------------------------------------------------
  const rows = (data || []).map((r) => ({
    id: r.id,
    status: r.status,
    service: r.service,
    dispatch_notes: r.dispatch_notes,
    scheduled_at: r.scheduled_at,
    created_at: r.created_at,
    vehicle: Array.isArray(r.vehicle) ? r.vehicle[0] : r.vehicle,
    customer: Array.isArray(r.customer) ? r.customer[0] : r.customer,
    location: Array.isArray(r.location) ? r.location[0] : r.location,
  }));

  return NextResponse.json(rows);
}
