import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/* ============================================================
   GET — Load a single vehicle
============================================================ */
export async function GET(req: Request, context: any) {
  const { id } = await context.params;   // FIXED

  const scope = await resolveUserScope();
  if (!scope.uid || !scope.isCustomer) {
    return NextResponse.json({ ok:false, error:"Unauthorized" }, { status:401 });
  }

  const supabase = await supabaseServer();

    const { data: v, error } = await supabase
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
      .eq("id", id)
      .eq("customer_id", scope.customer_id)
      .maybeSingle();

    if (error || !v) {
      return NextResponse.json({ ok: false, error: "Vehicle not found." });
    }

    return NextResponse.json({
      ok: true,
      vehicle: {
        ...v,
        provider_name: v.provider_company?.name ?? null,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: "Server error", detail: err.message },
      { status: 500 }
    );
  }
}

/* ============================================================
   PUT — Update vehicle
============================================================ */
export async function PUT(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;

  try {
    const scope = await resolveUserScope();

    if (!scope.uid || !scope.isCustomer) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const supabase = await supabaseServer();

    const update = {
      year: body.year,
      make: body.make,
      model: body.model,
      plate: body.plate || null,
      unit_number: body.unit_number || null,
      vin: body.vin || null,
      health_photo_1: body.health_photo_1 ?? undefined,
      health_photo_2: body.health_photo_2 ?? undefined,
      health_photo_3: body.health_photo_3 ?? undefined,
      provider_company_id: body.provider_company_id ?? undefined,
    };

    const { data, error } = await supabase
      .from("vehicles")
      .update(update)
      .eq("id", id)
      .eq("customer_id", scope.customer_id)
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
