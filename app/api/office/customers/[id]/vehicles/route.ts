import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/* =========================================================
   GET — List vehicles for customer (Office)
========================================================= */
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await supabaseServer();
  const customerId = params.id;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { data, error } = await supabase
    .from("vehicles")
    .select(`
      id,
      year,
      make,
      model,
      unit_number,
      plate,
      vin
    `)
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Vehicle load error:", error);
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    vehicles: data ?? [],
  });
}

/* =========================================================
   POST — Create vehicle for customer (Office)
========================================================= */
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await supabaseServer();
  const customerId = params.id;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const body = await req.json();
  const { year, make, model, unit_number, plate, vin } = body;

  if (!year || !make || !model) {
    return NextResponse.json(
      { ok: false, error: "Missing required fields" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("vehicles")
    .insert({
      customer_id: customerId,
      year,
      make,
      model,
      unit_number: unit_number || null,
      plate: plate || null,
      vin: vin || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Vehicle insert error:", error);
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    vehicle: data,
  });
}
