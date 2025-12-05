import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// ------------------------------------------------------------
// POST /api/customer/vehicles/add
// Add a vehicle to the logged-in customer's fleet
// ------------------------------------------------------------
export async function POST(req: Request) {
  try {
    const scope = await resolveUserScope();

    // --------------------------------------------------------
    // AUTH CHECK
    // --------------------------------------------------------
    if (!scope.uid || !scope.isCustomer) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const customerId = scope.customer_id;
    if (!customerId) {
      return NextResponse.json(
        { error: "Customer account not linked" },
        { status: 400 }
      );
    }

    const supabase = await supabaseServer();

    const {
      year,
      make,
      model,
      plate,
      vin,
      unit_number,
    } = await req.json();

    // --------------------------------------------------------
    // BASIC VALIDATION
    // --------------------------------------------------------
    if (!year || !make || !model) {
      return NextResponse.json(
        { error: "Year, make, and model are required." },
        { status: 400 }
      );
    }

    // --------------------------------------------------------
    // INSERT VEHICLE
    // --------------------------------------------------------
    const { data, error } = await supabase
      .from("vehicles")
      .insert({
        customer_id: customerId,
        year,
        make,
        model,
        plate: plate || null,
        vin: vin || null,
        unit_number: unit_number || null,
      })
      .select()
      .maybeSingle();

    if (error) {
      console.error("Add vehicle error:", error);
      return NextResponse.json(
        { error: "Failed to add vehicle" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, vehicle: data });
  } catch (err: any) {
    console.error("Add vehicle API ERROR:", err);
    return NextResponse.json(
      { error: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}



