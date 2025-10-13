// app/api/requests/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Admin client (server-only)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// helpers
const toNull = (v: any) =>
  v === undefined || v === null || (typeof v === "string" && v.trim() === "")
    ? null
    : v;

const toDateOrNull = (v: any) =>
  typeof v === "string" && v.trim() !== "" ? v : null;

const toIntOrNull = (v: any) => {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/**
 * GET /api/requests?status=NEW|SCHEDULED|IN_PROGRESS|COMPLETED&limit=50
 * Always returns JSON: { requests: [...], error?: string }
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const status = (url.searchParams.get("status") || "NEW").toUpperCase();
  const limit  = Number(url.searchParams.get("limit") || 50);

  const { data, error } = await supabaseAdmin
    .from("service_requests")
    .select("id, created_at, vehicle_id, service_type, priority, preferred_date_1, status")
    .eq("status", status)
    .order("created_at", { ascending: false })
    .limit(Number.isFinite(limit) ? limit : 50);

  if (error) {
    return NextResponse.json({ requests: [], vehiclesById: {}, error: error.message }, { status: 200 });
  }

  // fetch vehicles for any rows we got
  const ids = Array.from(new Set((data ?? []).map(r => r.vehicle_id).filter(Boolean))) as string[];
  let vehiclesById: Record<string, any> = {};

  if (ids.length) {
    const { data: veh } = await supabaseAdmin
      .from("vehicles")
      .select("id, unit_number, year, make, model, plate")
      .in("id", ids);

    if (veh) vehiclesById = Object.fromEntries(veh.map(v => [v.id, v]));
  }

  return NextResponse.json({ requests: data ?? [], vehiclesById }, { status: 200 });
}


/**
 * POST /api/requests
 * Body: { vehicle_id, company_id?, location_id?, service_type, fmc, priority, customer_notes?,
 *         preferred_date_1?, preferred_date_2?, preferred_date_3?, is_emergency?, odometer_miles? }
 */
export async function POST(req: Request) {
  const b = await req.json();

  // Resolve company_id if caller didn’t send it: look it up from the vehicle
  let company_id = toNull(b.company_id);
  if (!company_id && b.vehicle_id) {
    const { data: v } = await supabaseAdmin
      .from("vehicles")
      .select("company_id")
      .eq("id", b.vehicle_id)
      .single();
    company_id = v?.company_id ?? null;
  }

  const insertRow = {
    company_id,
    vehicle_id: b.vehicle_id,
    location_id: toNull(b.location_id),
    service_type: b.service_type,
    fmc: b.fmc,
    priority: b.priority ?? "NORMAL",
    customer_notes: toNull(b.customer_notes),
    preferred_date_1: toDateOrNull(b.preferred_date_1),
    preferred_date_2: toDateOrNull(b.preferred_date_2),
    preferred_date_3: toDateOrNull(b.preferred_date_3),
    is_emergency: !!b.is_emergency,
    odometer_miles: toIntOrNull(b.odometer_miles),
    status: "NEW",
  };

  // Basic required fields
  if (!insertRow.vehicle_id || !insertRow.company_id || !insertRow.service_type) {
    return NextResponse.json(
      { error: "vehicle_id, company_id, and service_type are required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("service_requests")
    .insert([insertRow])
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, id: data.id }, { status: 201 });
}
