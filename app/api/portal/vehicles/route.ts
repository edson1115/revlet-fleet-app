import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/portal/vehicles
 * Create a vehicle FOR THE LOGGED-IN CUSTOMER.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const {
      year,
      make,
      model,
      plate,
      unit_number,
      vin,
      location_id,
    } = body;

    const supabase = await supabaseServer();

    // Get logged-in user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !user.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Lookup the customer profile associated with this user
    const { data: prof, error: profErr } = await supabase
      .from("profiles")
      .select("id, role, customer_id, location_id")
      .eq("id", user.id)
      .maybeSingle();

    if (profErr || !prof) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 400 }
      );
    }

    if (!prof.customer_id) {
      return NextResponse.json(
        { error: "This user is not linked to a customer account" },
        { status: 403 }
      );
    }

    const finalLocationId = location_id || prof.location_id || null;

    // Insert new vehicle
    const { data, error } = await supabase
      .from("vehicles")
      .insert([
        {
          customer_id: prof.customer_id,
          location_id: finalLocationId,
          year: year || null,
          make: make || null,
          model: model || null,
          plate: plate || null,
          unit_number: unit_number || null,
          vin: vin || null,
        },
      ])
      .select("*")
      .maybeSingle();

    if (error) {
      console.error("Vehicle insert error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to create vehicle" },
        { status: 500 }
      );
    }

    return NextResponse.json({ vehicle: data }, { status: 200 });
  } catch (err: any) {
    console.error("Unexpected error in POST /api/portal/vehicles:", err);
    return NextResponse.json(
      { error: "Unexpected error" },
      { status: 500 }
    );
  }
}
