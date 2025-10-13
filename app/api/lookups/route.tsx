// app/api/lookups/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  // If your seed used fixed IDs, ABC Motors is ...0002; adjust if needed.
  const ABC_COMPANY_ID = "00000000-0000-0000-0000-000000000002";

  const [vehiclesRes, locationsRes] = await Promise.all([
    supabaseAdmin
      .from("vehicles")
      .select("id, year, make, model, vin, unit_number")
      .eq("company_id", ABC_COMPANY_ID)
      .order("unit_number", { ascending: true }),
    supabaseAdmin
      .from("company_locations")
      .select("id, name, address, city, state, zip")
      .eq("company_id", ABC_COMPANY_ID)
      .order("name", { ascending: true }),
  ]);

  if (vehiclesRes.error) return NextResponse.json({ error: vehiclesRes.error.message }, { status: 400 });
  if (locationsRes.error) return NextResponse.json({ error: locationsRes.error.message }, { status: 400 });

  return NextResponse.json({
    vehicles: vehiclesRes.data,
    locations: locationsRes.data,
    companyId: ABC_COMPANY_ID,
  });
}
