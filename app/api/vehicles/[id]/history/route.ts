import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(req: Request, ctx: any) {
  try {
    const { id } = await ctx.params;
    const supabase = await supabaseServer();

    // AUTH
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // PROFILE → CUSTOMER
    const { data: profile } = await supabase
      .from("profiles")
      .select("customer_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.customer_id) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // LOAD VEHICLE + HISTORY
    const { data: vehicle, error } = await supabase
      .from("vehicles")
      .select(
        `
        id,
        make,
        model,
        year,
        unit_number,
        plate,
        vin,
        notes_internal,

        mileage_override,
        last_reported_mileage,
        last_mileage_at,

        service_requests (
          id,
          status,
          service,
          mileage,
          po,
          ai_status,
          ai_po_number,
          notes,
          dispatch_notes,
          created_at,
          started_at,
          completed_at,
          scheduled_start_at,
          scheduled_end_at,
          technician:technician_id ( id, full_name ),
          location:location_id ( id, name )
        )
      `
      )
      .eq("id", id)
      .eq("customer_id", profile.customer_id)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 400 }
      );
    }

    if (!vehicle) {
      return NextResponse.json(
        { ok: false, error: "Vehicle not found" },
        { status: 404 }
      );
    }

    // ⭐⭐⭐ MILEAGE FIX STARTS HERE ⭐⭐⭐
    let displayMileage = vehicle.mileage_override ?? vehicle.last_reported_mileage ?? null;

    // Sort service requests newest → oldest
    const sorted = [...(vehicle.service_requests || [])].sort(
      (a, b) =>
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
    );

    // Find most recent request with mileage
    const latestMileageRequest = sorted.find((r) => r.mileage !== null);

    if (latestMileageRequest?.mileage) {
      displayMileage = latestMileageRequest.mileage;
    }

    // Attach to returned vehicle
    const vehicleWithDisplay = {
      ...vehicle,
      display_mileage: displayMileage,
    };
    // ⭐⭐⭐ MILEAGE FIX ENDS HERE ⭐⭐⭐

    return NextResponse.json({ ok: true, vehicle: vehicleWithDisplay });

  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}
