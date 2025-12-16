// app/api/customer/requests/tire-purchase/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      tire_size,
      quantity,
      notes,
      po_number,
      location_name,
    } = body;

    const supabase = await supabaseServer();

    // --------------------------------------------------
    // AUTH
    // --------------------------------------------------
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // --------------------------------------------------
    // LOAD CUSTOMER PROFILE
    // --------------------------------------------------
    const { data: profile } = await supabase
      .from("profiles")
      .select("customer_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.customer_id) {
      return NextResponse.json(
        { ok: false, error: "Invalid customer profile" },
        { status: 403 }
      );
    }

    // --------------------------------------------------
    // INSERT SERVICE REQUEST (NO VEHICLE BINDING)
    // --------------------------------------------------
    const { data, error } = await supabase
      .from("service_requests")
      .insert({
        customer_id: profile.customer_id,
        type: "TIRE_PURCHASE",
        service: "tire_purchase",
        status: "NEW",

        // tire-specific info (stored safely)
        tire_size,
        tire_quantity: quantity,
        dropoff_address: location_name,

        po: po_number,
        notes,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      request: data,
      message: "Tire Purchase Request Created",
    });
  } catch (err: any) {
    console.error("TIRE PURCHASE API ERROR:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Server error" },
      { status: 500 }
    );
  }
}
