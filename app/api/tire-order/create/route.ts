import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const body = await req.json();
  const supabase = await supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user)
    return NextResponse.json({ ok: false, error: "Unauthorized" });

  const { vendor, size, qty, market_id, notes } = body;

  const { data, error } = await supabase
    .from("tire_purchase_orders")
    .insert({
      vendor,
      size,
      qty,
      market_id,
      notes,
      requested_by: user.id,
    })
    .select()
    .maybeSingle();

  if (error) return NextResponse.json({ ok: false, error });

  return NextResponse.json({ ok: true, row: data });
}
