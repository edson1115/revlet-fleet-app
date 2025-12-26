import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";

export const dynamic = "force-dynamic";

/* GET: List Recent Requests (Dashboard/Queue) */
export async function GET() {
  const supabase = await supabaseServer();
  const scope = await resolveUserScope();

  if (!scope.uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: requests, error } = await supabase
    .from("service_requests")
    .select(`
      *,
      customer:customers(id, name),
      vehicle:vehicles(id, year, make, model, unit_number, plate)
    `)
    .order("created_at", { ascending: false })
    .limit(50); // Simple limit for now

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, requests });
}

/* POST: Create New Request */
export async function POST(req: Request) {
  const scope = await resolveUserScope();
  
  // Security Check
  if (!scope.uid || scope.role !== "OFFICE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const supabase = await supabaseServer();

  // Create the request
  const { data, error } = await supabase
    .from("service_requests")
    .insert({
      customer_id: body.customer_id,
      vehicle_id: body.vehicle_id,
      status: "NEW", // Always starts as NEW
      service_title: body.service_title,
      service_description: body.service_description,
      reported_mileage: body.reported_mileage || null, // ✅ Save Mileage
      created_by_role: "OFFICE",
      market_id: scope.marketId // Assign to office user's market
    })
    .select()
    .single();

  if (error) {
    console.error("Create Request Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, request: data });
}