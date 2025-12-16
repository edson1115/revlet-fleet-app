// app/api/customer/requests/[id]/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

/* ============================================================
   GET — Load single customer request
============================================================ */
export async function GET(req: Request, ctx: any) {
  try {
    const params = await ctx.params;
    const id = params.id as string;

    const supabase = await supabaseServer();

    // -----------------------------
    // AUTH
    // -----------------------------
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user)
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );

    // -----------------------------
    // PROFILE
    // -----------------------------
    const { data: profile } = await supabase
      .from("profiles")
      .select("customer_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.customer_id)
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 403 }
      );

    // -----------------------------
    // LOAD REQUEST
    // -----------------------------
    const { data: reqRow, error: reqErr } = await supabase
      .from("service_requests")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (reqErr)
      return NextResponse.json(
        { ok: false, error: reqErr.message },
        { status: 400 }
      );

    if (!reqRow)
      return NextResponse.json(
        { ok: false, error: "Request not found" },
        { status: 404 }
      );

    // Ensure ownership
    if (reqRow.customer_id !== profile.customer_id)
      return NextResponse.json(
        { ok: false, error: "Unauthorized request access" },
        { status: 403 }
      );

    // -----------------------------
    // LOAD VEHICLE
    // -----------------------------
    const { data: vehicle } = await supabase
      .from("vehicles")
      .select(
        `
        id,
        make,
        model,
        year,
        plate,
        unit_number,
        vin,
        mileage,
        mileage_override,
        last_reported_mileage
      `
      )
      .eq("id", reqRow.vehicle_id)
      .maybeSingle();

    // -----------------------------
    // LOAD TECH + LOCATION
    // -----------------------------
    let technician = null;
    if (reqRow.technician_id) {
      const { data: tech } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("id", reqRow.technician_id)
        .maybeSingle();
      if (tech) technician = tech;
    }

    let location = null;
    if (reqRow.location_id) {
      const { data: loc } = await supabase
        .from("locations")
        .select("id, name")
        .eq("id", reqRow.location_id)
        .maybeSingle();
      if (loc) location = loc;
    }

    // -----------------------------
    // RESPONSE
    // -----------------------------
    const request = {
      id: reqRow.id,
      type: reqRow.type,
      status: reqRow.status,
      service: reqRow.service,
      service_needed: reqRow.service,
      mileage: reqRow.mileage,
      po: reqRow.po,

      tire_size: reqRow.tire_size,
      tire_brand: reqRow.tire_brand,
      tire_model: reqRow.tire_model,
      tire_quantity: reqRow.tire_quantity,
      dropoff_address: reqRow.dropoff_address,

      ai_status: reqRow.ai_status,
      ai_po_number: reqRow.ai_po_number,
      fmc: reqRow.fmc,
      urgent: !!reqRow.urgent,
      key_drop: !!reqRow.key_drop,
      parking_location: reqRow.parking_location,
      created_at: reqRow.created_at,
      completed_at: reqRow.completed_at,
      scheduled_start_at: reqRow.scheduled_start_at,
      scheduled_end_at: reqRow.scheduled_end_at,
      notes: reqRow.notes,
      dispatch_notes: reqRow.dispatch_notes,
      technician,
      location,

      vehicle: vehicle
        ? {
            id: vehicle.id,
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            plate: vehicle.plate,
            unit_number: vehicle.unit_number,
            vin: vehicle.vin,
            mileage: vehicle.mileage,
            mileage_override: vehicle.mileage_override,
            last_reported_mileage: vehicle.last_reported_mileage,
          }
        : null,
    };

    return NextResponse.json({ ok: true, request });
  } catch (err: any) {
    console.error("REQUEST API CRASH:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Server error" },
      { status: 500 }
    );
  }
}

/* ============================================================
   DELETE — Delete customer request (NEW only)
============================================================ */
export async function DELETE(req: Request, ctx: any) {
  try {
    const params = await ctx.params;
    const id = params.id as string;

    const supabase = await supabaseServer();

    // -----------------------------
    // AUTH
    // -----------------------------
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user)
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );

    // -----------------------------
    // PROFILE
    // -----------------------------
    const { data: profile } = await supabase
      .from("profiles")
      .select("customer_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.customer_id)
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 403 }
      );

    // -----------------------------
    // LOAD REQUEST
    // -----------------------------
    const { data: reqRow, error } = await supabase
      .from("service_requests")
      .select("id, status, customer_id")
      .eq("id", id)
      .maybeSingle();

    if (error)
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 400 }
      );

    if (!reqRow)
      return NextResponse.json(
        { ok: false, error: "Request not found" },
        { status: 404 }
      );

    // Ownership
    if (reqRow.customer_id !== profile.customer_id)
      return NextResponse.json(
        { ok: false, error: "Unauthorized request access" },
        { status: 403 }
      );

    // Status guard
    if (reqRow.status !== "NEW")
      return NextResponse.json(
        { ok: false, error: "Only NEW requests can be deleted" },
        { status: 400 }
      );

    // -----------------------------
    // DELETE
    // -----------------------------
    const { error: delErr } = await supabase
      .from("service_requests")
      .delete()
      .eq("id", id);

    if (delErr)
      return NextResponse.json(
        { ok: false, error: delErr.message },
        { status: 400 }
      );

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("REQUEST DELETE CRASH:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Server error" },
      { status: 500 }
    );
  }
}
