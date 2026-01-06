import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";

export async function POST(req: Request) {
  try {
    const scope = await resolveUserScope();
    if (!scope.uid || !["OFFICE", "ADMIN", "SUPERADMIN"].includes(scope.role)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const supabase = await supabaseServer();

    // Insert Vehicle with FMC (provider_id)
    const { data: vehicle, error } = await supabase
      .from("vehicles")
      .insert({
        customer_id: body.customer_id,
        year: parseInt(body.year),
        make: body.make,
        model: body.model,
        plate: body.plate || null,
        vin: body.vin || null,
        provider_id: body.provider_id || null // <--- ADD THIS LINE
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ ok: true, vehicle });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}