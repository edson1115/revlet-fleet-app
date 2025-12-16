import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/* ============================================================
   GET — Load vehicles for logged-in customer
============================================================ */
export async function GET() {
  try {
    const scope = await resolveUserScope();

    if (!scope.uid || !scope.isCustomer) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = await supabaseServer();

    const { data: rows, error } = await supabase
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
        health_photo_1,
        health_photo_2,
        health_photo_3,
        provider_company_id,
        provider_company:provider_companies(id, name)
      `)
      .eq("customer_id", scope.customer_id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message });
    }

    const vehicles = (rows || []).map((v) => ({
      id: v.id,
      year: v.year,
      make: v.make,
      model: v.model,
      plate: v.plate,
      unit_number: v.unit_number,
      vin: v.vin,
      market: v.market,

      // ⭐ ADDED HEALTH PHOTOS
      health_photo_1: v.health_photo_1 || null,
      health_photo_2: v.health_photo_2 || null,
      health_photo_3: v.health_photo_3 || null,

      provider_name: v.provider_company?.name ?? null,
    }));

    return NextResponse.json({ ok: true, vehicles });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: "Server error", detail: err.message },
      { status: 500 }
    );
  }
}

/* ============================================================
   POST — Add a new vehicle for logged-in customer
============================================================ */
export async function POST(req: Request) {
  try {
    const scope = await resolveUserScope();

    if (!scope.uid || !scope.isCustomer) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = await supabaseServer();
    const body = await req.json();

    const newVehicle = {
      customer_id: scope.customer_id,
      market: scope.active_market,
      year: body.year,
      make: body.make,
      model: body.model,
      plate: body.plate || null,
      vin: body.vin || null,
      unit_number: body.unit_number || null,

      // ⭐ HEALTH PHOTOS SAVED
      health_photo_1: body.health_photo_1 || null,
      health_photo_2: body.health_photo_2 || null,
      health_photo_3: body.health_photo_3 || null,

      provider_company_id: body.provider_company_id || null,
    };

    const { data, error } = await supabase
      .from("vehicles")
      .insert(newVehicle)
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message });
    }

    return NextResponse.json({ ok: true, vehicle: data });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: "Server error", detail: err.message },
      { status: 500 }
    );
  }
}

