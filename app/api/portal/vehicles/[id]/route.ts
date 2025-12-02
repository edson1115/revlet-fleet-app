// app/api/portal/vehicles/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";

export const dynamic = "force-dynamic";

/* ============================================================
   GET /api/portal/vehicles/:id
   (Customer portal — fetch a single vehicle)
============================================================ */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await supabaseServer();
    const scope = await resolveUserScope();

    if (!scope.uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!scope.isCustomer) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("vehicles")
      .select(
        `
          id,
          customer_id,
          location_id,
          year,
          make,
          model,
          plate,
          unit_number,
          vin,
          customer:customers(id, name),
          location:locations(id, name)
        `
      )
      .eq("id", params.id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // RLS guarantees, but double-check:
    if (data.customer_id !== scope.customer_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ vehicle: data });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Failed" },
      { status: 500 }
    );
  }
}

/* ============================================================
   PATCH /api/portal/vehicles/:id
   Customer can update their own vehicle.
============================================================ */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json().catch(() => ({}));
    const supabase = await supabaseServer();
    const scope = await resolveUserScope();

    if (!scope.uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!scope.isCustomer) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const allowedFields = {
      year: body.year ?? null,
      make: body.make ?? null,
      model: body.model ?? null,
      plate: body.plate ?? null,
      unit_number: body.unit_number ?? null,
      vin: body.vin ?? null,
      location_id: body.location_id ?? null,
    };

    const { data, error } = await supabase
      .from("vehicles")
      .update(allowedFields)
      .eq("id", params.id)
      .eq("customer_id", scope.customer_id) // double-check
      .select("*")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ vehicle: data });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Failed" },
      { status: 500 }
    );
  }
}

/* ============================================================
   DELETE /api/portal/vehicles/:id
============================================================ */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await supabaseServer();
    const scope = await resolveUserScope();

    if (!scope.uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!scope.isCustomer) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error } = await supabase
      .from("vehicles")
      .delete()
      .eq("id", params.id)
      .eq("customer_id", scope.customer_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Failed" },
      { status: 500 }
    );
  }
}
