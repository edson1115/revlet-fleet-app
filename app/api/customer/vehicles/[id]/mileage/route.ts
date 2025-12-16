import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";

export async function POST(req: Request, { params }: any) {
  const scope = await resolveUserScope();

  if (!scope.uid || !scope.isCustomer) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { id } = params;
  const supabase = await supabaseServer();
  const { mileage } = await req.json();

  if (!mileage) {
    return NextResponse.json(
      { ok: false, error: "Mileage required" },
      { status: 400 }
    );
  }

  // Validate owner
  const { data: owned } = await supabase
    .from("vehicles")
    .select("id")
    .eq("id", id)
    .eq("customer_id", scope.customer_id)
    .maybeSingle();

  if (!owned) {
    return NextResponse.json(
      { ok: false, error: "Vehicle not found or forbidden" },
      { status: 403 }
    );
  }

  const { error } = await supabase
    .from("vehicles")
    .update({
      mileage,
      last_reported_mileage: mileage,
      last_mileage_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message });
  }

  return NextResponse.json({ ok: true });
}
