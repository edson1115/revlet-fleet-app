import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const customerId = params.id;

  const supabase = await supabaseServer();

  /* -------------------------------------------------
     AUTH CHECK
  ------------------------------------------------- */
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  /* -------------------------------------------------
     ROLE CHECK (OFFICE ONLY)
  ------------------------------------------------- */
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["OFFICE", "ADMIN", "SUPERADMIN"].includes(profile.role)) {
    return NextResponse.json(
      { ok: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  /* -------------------------------------------------
     PARSE BODY
  ------------------------------------------------- */
  const body = await req.json();

  const {
    year,
    make,
    model,
    unit_number,
    plate,
    vin,
  } = body;

  if (!year || !make || !model) {
    return NextResponse.json(
      { ok: false, error: "Missing required fields" },
      { status: 400 }
    );
  }

  /* -------------------------------------------------
     INSERT VEHICLE
  ------------------------------------------------- */
  const { data: vehicle, error } = await supabase
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
      { ok: false, error: "Failed to create vehicle" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    vehicle,
  });
}
