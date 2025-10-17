// app/api/admin/markets/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { name, order_index = 0, company_id } = await req.json();

    if (!name || !company_id) {
      return NextResponse.json({ error: "name and company_id are required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("company_locations")
      .insert({
        company_id,
        name,
        order_index,
        location_type: "MARKET",
      })
      .select("*")
      .single();

    if (error) throw error;
    return NextResponse.json({ market: data }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to create market" }, { status: 500 });
  }
}
