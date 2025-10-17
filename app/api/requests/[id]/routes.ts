// app/api/requests/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

type Id = string;

/**
 * GET /api/requests/:id
 * Loads a single service request with joined display fields (location/customer/vehicle).
 */
export async function GET(_: NextRequest, { params }: { params: { id: Id } }) {
  try {
    const supabase = await supabaseServer();

    const { data, error } = await supabase
      .from("service_requests")
      .select(`
        id,
        status,
        service,
        fmc,
        mileage,
        po,
        notes,
        scheduled_at,
        preferred_window_start,
        preferred_window_end,
        priority,
        updated_at,
        location:location_id ( name ),
        customer:customer_id ( name ),
        vehicle:vehicle_id ( year, make, model, plate, unit_number )
      `)
      .eq("id", params.id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ request: data });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed to load request" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/requests/:id
 * Office-safe editable fields only. Supports legacy aliases:
 *   - po_number  -> po
 *   - office_notes -> notes
 *   - odometer_miles -> mileage
 * Optional optimistic concurrency via expected_updated_at.
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: Id } }) {
  try {
    const id = params.id;
    const body = await req.json();

    const supabase = await supabaseServer();

    // Build a sanitized update patch.
    // Primary field names:
    //  - fmc, po, notes, priority, location_id, preferred_window_start, preferred_window_end, mileage
    // Legacy aliases mapped in:
    //  - po_number -> po
    //  - office_notes -> notes
    //  - odometer_miles -> mileage
    const allowedKeys = new Set([
      "fmc",
      "po",
      "notes",
      "priority",
      "location_id",
      "preferred_window_start",
      "preferred_window_end",
      "mileage",
    ]);

    const patch: Record<string, any> = {};

    // Copy direct fields if present
    for (const k of Object.keys(body || {})) {
      if (allowedKeys.has(k)) patch[k] = body[k];
    }

    // Map legacy aliases (non-destructive)
    if (body.po_number != null && patch.po == null) patch.po = body.po_number;
    if (body.office_notes != null && patch.notes == null) patch.notes = body.office_notes;
    if (body.odometer_miles != null && patch.mileage == null) patch.mileage = body.odometer_miles;

    // Trim strings where reasonable
    if (typeof patch.po === "string") {
      patch.po = patch.po.trim() || null;
    }
    if (typeof patch.notes === "string") {
      patch.notes = patch.notes.trim() || null;
    }
    if (typeof patch.fmc === "string") {
      patch.fmc = patch.fmc.trim() || null;
    }

    // Guard: nothing to update
    if (Object.keys(patch).length === 0) {
      return NextResponse.json(
        { error: "No editable fields provided." },
        { status: 400 }
      );
    }

    // Optional optimistic concurrency
    if (body.expected_updated_at) {
      const { data: current, error: readErr } = await supabase
        .from("service_requests")
        .select("updated_at, status")
        .eq("id", id)
        .single();

      if (readErr) throw readErr;

      // If you want to restrict editing to NEW status only, keep this:
      // (You had this behavior in your snippet; keep/adjust as you prefer.)
      if (current?.status && current.status !== "NEW") {
        return NextResponse.json(
          { error: "Request is no longer NEW; refresh your page." },
          { status: 409 }
        );
      }

      if (
        current?.updated_at &&
        String(current.updated_at) !== String(body.expected_updated_at)
      ) {
        return NextResponse.json(
          { error: "Row was updated by someone else. Refresh and try again." },
          { status: 409 }
        );
      }
    }

    // Update — do NOT change status here.
    const { data, error } = await supabase
      .from("service_requests")
      .update(patch)
      .eq("id", id)
      .select(
        `
        id,
        status,
        service,
        fmc,
        mileage,
        po,
        notes,
        scheduled_at,
        preferred_window_start,
        preferred_window_end,
        priority,
        updated_at
      `
      )
      .single();

    if (error) throw error;

    return NextResponse.json({ request: data });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed to update request" },
      { status: 500 }
    );
  }
}
