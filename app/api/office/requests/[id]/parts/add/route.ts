import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const scope = await resolveUserScope();
  const { id } = await params;

  if (!scope.uid || scope.role !== "OFFICE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const supabase = await supabaseServer();

  let cost = 0;
  let price = 0;

  // 1. If Inventory ID is provided, fetch the PRICING from the warehouse
  if (body.inventory_id) {
      const { data: stockItem } = await supabase
          .from("inventory")
          .select("cost, sell_price")
          .eq("id", body.inventory_id)
          .single();
      
      if (stockItem) {
          cost = stockItem.cost;
          price = stockItem.sell_price;
      }
  }

  // 2. Insert part with the CORRECT PRICE
  const { data, error } = await supabase
    .from("request_parts")
    .insert({
      request_id: id,
      inventory_id: body.inventory_id || null,
      part_name: body.part_name,
      part_number: body.part_number,
      quantity: parseInt(body.quantity) || 1,
      cost: cost,    // ✅ Automatic Cost
      price: price   // ✅ Automatic Sell Price
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, part: data });
}