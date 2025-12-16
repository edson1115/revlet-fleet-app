import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";

export async function DELETE(req: Request, { params }: any) {
  const scope = await resolveUserScope();

  if (!scope.uid || !scope.isCustomer) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await supabaseServer();
  const { id } = params;

  // 1. Ensure customer owns this vehicle
  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("id")
    .eq("id", id)
    .eq("customer_id", scope.customer_id)
    .maybeSingle();

  if (!vehicle) {
    return NextResponse.json(
      { ok: false, error: "Vehicle not found or not yours" },
      { status: 403 }
    );
  }

  // 2. BLOCK deletion if vehicle has service history
  const { count: serviceCount } = await supabase
    .from("service_requests")
    .select("id", { count: "exact", head: true })
    .eq("vehicle_id", id);

  if (serviceCount && serviceCount > 0) {
    return NextResponse.json(
      { ok: false, error: "This vehicle has service history and cannot be deleted." },
      { status: 400 }
    );
  }

  // 3. SAFE DELETE VEHICLE
  const { error } = await supabase
    .from("vehicles")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
