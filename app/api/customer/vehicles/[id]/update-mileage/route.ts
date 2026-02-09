import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";

export async function POST(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  // FIX: Await params for Next.js 15
  const params = await props.params;
  const vehicleId = params.id;

  const scope = await resolveUserScope();
  if (!scope.isCustomer) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { mileage } = body;

    if (!mileage) {
        return NextResponse.json({ ok: false, error: "Mileage required" }, { status: 400 });
    }

    const supabase = await supabaseServer();

    // Update mileage securely
    const { error } = await supabase
        .from("vehicles")
        .update({ mileage: mileage })
        .eq("id", vehicleId)
        .eq("customer_id", scope.customer_id); // Ensure ownership

    if (error) {
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }
}