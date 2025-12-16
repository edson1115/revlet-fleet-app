import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const scope = await resolveUserScope();

    if (!scope.uid || !scope.isCustomer) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await supabaseServer();

    const { data: rows, error } = await supabase
      .from("vehicles")
      .select(`
        id, year, make, model, plate, unit_number, vin, market,
        health_photo_1, health_photo_2, health_photo_3,
        provider_company:provider_companies(id, name)
      `)
      .eq("customer_id", scope.customer_id)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ ok:false, error:error.message });

    return NextResponse.json({ ok:true, vehicles: rows });
  } catch (err: any) {
    return NextResponse.json(
      { ok:false, error:"Server error", detail:err.message },
      { status: 500 }
    );
  }
}
