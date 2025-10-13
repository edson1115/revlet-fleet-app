// app/api/vehicles/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Server-only client using the service role key (never expose in the browser)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/vehicles
 * Optional query: ?company_id=<uuid>
 * Returns a list of vehicles (defaults to ABC Motors from seed if not provided).
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const company_id =
    searchParams.get("company_id") ?? "00000000-0000-0000-0000-000000000002";

  const { data, error } = await supabaseAdmin
    .from("vehicles")
    .select("id, year, make, model, vin, unit_number, plate, company_id, location_id")
    .eq("company_id", company_id)
    .order("unit_number", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ vehicles: data });
}

/**
 * POST /api/vehicles
 * Body: { year, make, model, vin, unit_number?, plate?, company_id?, location_id? }
 * Creates a single vehicle row.
 */
export async function POST(req: Request) {
  const b = await req.json();

  const {
    company_id = "00000000-0000-0000-0000-000000000002", // ABC Motors (seed)
    location_id = null,
    year,
    make,
    model,
    vin,
    unit_number = null,
    plate = null,
  } = b ?? {};

  if (!year || !make || !model || !vin) {
    return NextResponse.json(
      { error: "year, make, model, vin are required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("vehicles")
    .insert([{ company_id, location_id, year, make, model, vin, unit_number, plate }])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, vehicle: data }, { status: 201 });
}
