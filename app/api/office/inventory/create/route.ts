import { NextResponse } from "next/server";
// 1. Remove supabaseServer import
// import { supabaseServer } from "@/lib/supabase/server"; 
import { createClient } from "@supabase/supabase-js"; // 👈 Add this
import { resolveUserScope } from "@/lib/api/scope";

export async function POST(req: Request) {
  const scope = await resolveUserScope();

  // 1. Auth Guard (We keep this strict!)
  if (!scope.uid || !["OFFICE", "ADMIN", "SUPERADMIN"].includes(scope.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  // 2. Setup Admin Client (Bypasses RLS)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 3. Validate
  if (!body.part_number || !body.part_name) {
    return NextResponse.json({ error: "Part Number and Name are required" }, { status: 400 });
  }

  // 4. Insert into Inventory
  const { data, error } = await supabase
    .from("inventory")
    .insert({
      part_number: body.part_number,
      part_name: body.part_name,
      quantity: parseInt(body.quantity) || 0,
      cost: parseFloat(body.cost) || 0,
      sell_price: parseFloat(body.sell_price) || 0,
      vendor: body.vendor || null,
      bin_location: body.bin_location || null
    })
    .select()
    .single();

  if (error) {
    console.error("Inventory Create Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, item: data });
}