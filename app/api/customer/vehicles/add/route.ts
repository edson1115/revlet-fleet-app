import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";

export async function POST(req: Request) {
  const scope = await resolveUserScope();

  if (!scope.uid || !scope.isCustomer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await supabaseServer();

  const { year, make, model, plate, vin, unit_number } = await req.json();

  const { data: profile } = await supabase
    .from("profiles")
    .select("customer_id, active_market")
    .eq("id", scope.uid)
    .maybeSingle();

  if (!profile?.customer_id) {
    return NextResponse.json(
      { error: "Customer account not linked" },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("vehicles").insert({
    customer_id: profile.customer_id,
    market: profile.active_market,  // REQUIRED FOR RLS
    year,
    make,
    model,
    plate,
    vin,
    unit_number
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
