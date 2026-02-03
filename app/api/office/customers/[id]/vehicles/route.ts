import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/* GET: List Vehicles */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // ✅ Fix: Type as Promise
) {
  const { id: customerId } = await params; // ✅ Fix: Await params

  const supabase = await supabaseServer();
  // Simple auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("vehicles")
    .select("id, year, make, model, unit_number, plate, vin")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, vehicles: data ?? [] });
}

/* POST: Create Vehicle */
// ... (keep the GET function as is) ...

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: customerId } = await params;
  const supabase = await supabaseServer();
  
  // Auth check...
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { year, make, model, unit_number, plate, vin, provider_company_id } = body; // ✅ Added provider_company_id

  if (!year || !make || !model) {
    return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("vehicles")
    .insert({
      customer_id: customerId,
      year,
      make,
      model,
      unit_number: unit_number || null,
      plate: plate || null,
      vin: vin || null,
      active: true,
      provider_company_id: provider_company_id || null // ✅ Save it
    })
    .select()
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, vehicle: data });
}
