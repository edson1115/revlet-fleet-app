// app/api/customer/requests/tire-purchase/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      vehicle_id,
      tire_size,
      quantity,
      notes,
      po_number,
      location_name,
    } = body;

    const supabase = await supabaseServer();

    // 1. Auth
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user)
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    // 2. Insert service request
    const { data, error } = await supabase
      .from("service_requests")
      .insert({
        customer_id: user.id,
        vehicle_id,
        type: "TIRE_PURCHASE",
        status: "WAITING",
        tire_size,
        quantity,
        notes,
        po_number,
        location_name,
        origin: "CUSTOMER_PORTAL",
      })
      .select()
      .single();

    if (error)
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });

    return NextResponse.json({
      ok: true,
      request: data,
      message: "Tire Purchase Request Created",
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message });
  }
}
