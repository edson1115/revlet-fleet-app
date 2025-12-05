// app/api/portal/vehicles/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/* ============================================================
   GET /api/portal/vehicles
   Return vehicles owned by the logged-in CUSTOMER
============================================================ */
export async function GET(req: NextRequest) {
  try {
    const supabase = await supabaseServer();
    const scope = await resolveUserScope();

    if (!scope.uid)
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    // CUSTOMER PORTAL: Only see own vehicles
    if (!scope.isCustomer) {
      return NextResponse.json(
        { rows: [], error: "forbidden" },
        { status: 403 }
      );
    }

    const { data, error } = await supabase
      .from("vehicles")
      .select(
        "id, year, make, model, plate, unit_number, vin, customer_id, location_id"
      )
      .eq("customer_id", scope.customer_id)
      .order("unit_number", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ rows: data || [] });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "failed to load vehicles" },
      { status: 500 }
    );
  }
}

/* ============================================================
   POST /api/portal/vehicles
   Create a new vehicle FOR THE LOGGED-IN CUSTOMER
============================================================ */
export async function POST(req: NextRequest) {
  try {
    const supabase = await supabaseServer();
    const scope = await resolveUserScope();

    if (!scope.uid)
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    // Only customers can add vehicles through Portal
    if (!scope.isCustomer) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "invalid_json" }, { status: 400 });
    }

    const { year, make, model, plate, unit_number, vin, location_id } = body;

    const insert = {
      customer_id: scope.customer_id,
      location_id: location_id || null,
      year: year || null,
      make: make || null,
      model: model || null,
      plate: plate || null,
      unit_number: unit_number || null,
      vin: vin || null,
    };

    const { data, error } = await supabase
      .from("vehicles")
      .insert(insert)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ vehicle: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "unexpected_error" },
      { status: 500 }
    );
  }
}



