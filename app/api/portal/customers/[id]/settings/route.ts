// app/api/portal/customers/[id]/settings/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const supabase = await supabaseServer();
  const customerId = new URL(req.url).pathname.split("/")[4];

  const { data: customer } = await supabase
    .from("customers")
    .select("*")
    .eq("id", customerId)
    .maybeSingle();

  return NextResponse.json({ customer });
}
