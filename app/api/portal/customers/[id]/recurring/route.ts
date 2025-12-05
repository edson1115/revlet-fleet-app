// app/api/portal/customers/[id]/recurring/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const supabase = await supabaseServer();
  const url = new URL(req.url);
  const customerId = url.pathname.split("/")[4];

  const { data: items } = await supabase
    .from("recurring_rules")
    .select("*")
    .eq("customer_id", customerId)
    .order("next_run");

  return NextResponse.json({ items: items || [] });
}

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const url = new URL(req.url);
  const customerId = url.pathname.split("/")[4];
  const body = await req.json();

  await supabase.from("recurring_rules").insert({
    customer_id: customerId,
    frequency: body.frequency,
    weekday: body.weekday,
    day_of_month: body.day_of_month,
    active: true,
    next_run: new Date().toISOString(),
  });

  return NextResponse.json({ success: true });
}
