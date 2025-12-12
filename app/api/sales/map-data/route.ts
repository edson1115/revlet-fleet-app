import { supabaseServer } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await supabaseServer();

  const { data: leads } = await supabase
    .from("sales_leads")
    .select("id, business_name, lat, lng, market, sales_rep_id");

  const { data: customers } = await supabase
    .from("customers")
    .select("id, business_name, lat, lng, market");

  return NextResponse.json({
    ok: true,
    leads: leads || [],
    customers: customers || [],
  });
}
