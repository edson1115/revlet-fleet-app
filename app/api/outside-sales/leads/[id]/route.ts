import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(req: Request, ctx: any) {
  const id = ctx.params.id;
  const supabase = await supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user)
    return NextResponse.json({ ok: false, error: "Unauthorized" });

  const { data: lead } = await supabase
    .from("sales_leads")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  const { data: updates } = await supabase
    .from("sales_lead_updates")
    .select("*")
    .eq("lead_id", id)
    .order("created_at");

  return NextResponse.json({ ok: true, lead, updates });
}
