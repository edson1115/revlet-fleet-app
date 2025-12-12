// app/api/customer/requests/tire-order/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      fleet_name,
      order_items, // [{ vehicle_id, tire_size, quantity }]
      po_number,
      delivery_timeframe,
      notes,
    } = body;

    const supabase = await supabaseServer();

    // 1. Auth
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user)
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    // 2. Create parent TIRE_ORDER record
    const { data: order, error: orderErr } = await supabase
      .from("tire_orders")
      .insert({
        customer_id: user.id,
        fleet_name,
        po_number,
        delivery_timeframe,
        notes,
      })
      .select()
      .single();

    if (orderErr)
      return NextResponse.json({ ok: false, error: orderErr.message });

    const orderId = order.id;

    // 3. Insert all line items
    const itemsPayload = order_items.map((i: any) => ({
      order_id: orderId,
      vehicle_id: i.vehicle_id,
      tire_size: i.tire_size,
      quantity: i.quantity,
    }));

    const { error: lineErr } = await supabase
      .from("tire_order_items")
      .insert(itemsPayload);

    if (lineErr)
      return NextResponse.json({ ok: false, error: lineErr.message });

    return NextResponse.json({
      ok: true,
      order,
      message: "Bulk Tire Order Created",
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message });
  }
}
