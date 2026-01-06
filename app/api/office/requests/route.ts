import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";

export const dynamic = "force-dynamic";

/* ============================================================
   GET — Office Dashboard Requests
============================================================ */
export async function GET() {
  const supabase = await supabaseServer();
  const scope = await resolveUserScope();

  if (!scope.uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: requests, error } = await supabase
    .from("service_requests")
    .select(`
      *,
      customer:customers(id, name),
      vehicle:vehicles(id, year, make, model, unit_number, plate)
    `)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const PRIORITY: Record<string, number> = {
    NEW: 1,
    WAITING: 2,
    READY_TO_SCHEDULE: 3,
    SCHEDULED: 4,
    IN_PROGRESS: 5,
    COMPLETED: 6,
  };

  const sortedRequests = (requests || []).sort((a, b) => {
    const scoreA = PRIORITY[a.status] ?? 99;
    const scoreB = PRIORITY[b.status] ?? 99;

    if (scoreA !== scoreB) return scoreA - scoreB;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return NextResponse.json({ ok: true, requests: sortedRequests });
}

/* ============================================================
   POST — Create New Service Request (OFFICE ONLY)
   ✅ Snapshot vehicle plate at creation time
============================================================ */
export async function POST(req: Request) {
  const scope = await resolveUserScope();

  if (!scope.uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (scope.role !== "OFFICE") {
    return NextResponse.json(
      { error: "Only OFFICE can create service requests" },
      { status: 403 }
    );
  }

  const body = await req.json();
  const supabase = await supabaseServer();

  // 🔹 Fetch vehicle snapshot
  const { data: vehicle, error: vehicleError } = await supabase
    .from("vehicles")
    .select("plate")
    .eq("id", body.vehicle_id)
    .single();

  if (vehicleError) {
    return NextResponse.json(
      { error: "Failed to load vehicle for request" },
      { status: 500 }
    );
  }

  // 🔹 Insert service request with plate snapshot
  const { data, error } = await supabase
    .from("service_requests")
    .insert({
      customer_id: body.customer_id,
      vehicle_id: body.vehicle_id,
      plate: vehicle?.plate ?? null, // ✅ SNAPSHOT
      status: "NEW",
      service_title: body.service_title,
      service_description: body.service_description,
      reported_mileage: body.reported_mileage || null,
      created_by_role: "OFFICE",
      market_id: scope.marketId,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, request: data });
}
