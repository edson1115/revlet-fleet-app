import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET() {
  // FIX — must await
  const supabase = await supabaseServer();

  // AUTH
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  // PROFILE → CUSTOMER_ID
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("customer_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileErr) {
    return NextResponse.json(
      { ok: false, error: profileErr.message },
      { status: 400 }
    );
  }

  if (!profile?.customer_id) {
    return NextResponse.json(
      { ok: false, error: "Not a customer profile" },
      { status: 403 }
    );
  }

  // LOAD VEHICLES FOR DROPDOWN
  const { data: vehicles, error: vehErr } = await supabase
    .from("vehicles")
    .select("id, make, model, year, unit_number, plate")
    .eq("customer_id", profile.customer_id)
    .order("unit_number", { ascending: true });

  if (vehErr) {
    return NextResponse.json(
      { ok: false, error: vehErr.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    vehicles: vehicles ?? [],
  });
}
