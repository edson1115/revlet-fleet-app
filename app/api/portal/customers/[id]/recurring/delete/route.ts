// app/api/portal/customers/[id]/recurring/delete/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const body = await req.json();

  await supabase.from("recurring_rules").delete().eq("id", body.id);

  return NextResponse.json({ success: true });
}
