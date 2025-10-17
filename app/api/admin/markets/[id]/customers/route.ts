// app/api/admin/markets/[id]/customers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const marketId = params.id;
  try {
    const { assign, customer_ids, market_name } = await req.json();
    if (!Array.isArray(customer_ids) || customer_ids.length === 0) {
      return NextResponse.json({ error: "customer_ids array required" }, { status: 400 });
    }

    // sanity: verify market exists
    const { data: isMarket, error: mErr } = await supabaseAdmin
      .from("company_locations")
      .select("id, name, location_type")
      .eq("id", marketId)
      .single();
    if (mErr) throw mErr;
    if (!isMarket || isMarket.location_type !== "MARKET") {
      return NextResponse.json({ error: "Invalid market id" }, { status: 400 });
    }

    const newValue = assign ? (market_name || isMarket.name) : null;

    const { error } = await supabaseAdmin
      .from("company_customers")
      .update({ market: newValue })
      .in("id", customer_ids);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to update customer assignments" }, { status: 500 });
  }
}
