import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/* ============================================================
   GET — Load a single vehicle (customer-owned)
============================================================ */
export async function GET(
  req: Request,
  ctx: { params: { id: string } }
) {
  try {
    const { id } = await ctx.params; // ✅ Next.js 15 fix

    const scope = await resolveUserScope();
    if (!scope.uid || !scope.isCustomer) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await supabaseServer();

    const { data: vehicle, error } = await supabase
      .from("vehicles")
      .select(`
        id,
        customer_id,
        year,
        make,
        model,
        plate,
        unit_number,
        vin,
        market,
        mileage_override,
        last_reported_mileage,
        health_photo_1,
        health_photo_2,
        health_photo_3,
        provider_company_id,
        provider_company:provider_companies(id, name)
      `)
      .eq("id", id)
      .eq("customer_id", scope.customer_id)
      .maybeSingle();

    if (error || !vehicle) {
      return NextResponse.json({ ok: false, error: "Vehicle not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, vehicle });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: "Server error", detail: err.message },
      { status: 500 }
    );
  }
}

/* ============================================================
   PUT — Update vehicle (mileage + FMC)
============================================================ */
export async function PUT(
  req: Request,
  ctx: { params: { id: string } }
) {
  try {
    const { id } = await ctx.params; // ✅ Next.js 15 fix

    const scope = await resolveUserScope();
    if (!scope.uid || !scope.isCustomer) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const supabase = await supabaseServer();

    const update: any = {};

    if (typeof body.mileage === "number") {
      update.mileage_override = body.mileage;
    }

    if ("provider_id" in body) {
      update.provider_company_id = body.provider_id || null;
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json(
        { ok: false, error: "Nothing to update" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("vehicles")
      .update(update)
      .eq("id", id)
      .eq("customer_id", scope.customer_id)
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, vehicle: data });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: "Server error", detail: err.message },
      { status: 500 }
    );
  }
}
