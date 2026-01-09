import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";

export async function POST(req: Request) {
  try {
    const scope = await resolveUserScope();
    
    // 1. Auth Guard
    if (!scope.uid || !["OFFICE", "ADMIN", "SUPERADMIN", "DISPATCH"].includes(scope.role)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const supabase = await supabaseServer();

    // 2. Insert Vehicle
    // ✅ REMOVED 'provider_id' because the column does not exist in your database yet.
    const { data: vehicle, error } = await supabase
      .from("vehicles")
      .insert({
        customer_id: body.customer_id,
        year: parseInt(body.year),
        make: body.make,
        model: body.model,
        plate: body.plate || null,
        vin: body.vin || null,
        // provider_id: body.provider_id || null // ❌ Commented out until DB migration is run
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ ok: true, vehicle });
  } catch (e: any) {
    console.error("Vehicle Create Error:", e.message);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}