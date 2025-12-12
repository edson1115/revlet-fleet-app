import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: Request, ctx: any) {
  const id = ctx.params.id;
  const supabase = await supabaseServer();
  const body = await req.json();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user)
    return NextResponse.json({ ok: false, error: "Unauthorized" });

  const { error } = await supabase.from("sales_lead_updates").insert({
    lead_id: id,
    rep_id: user.id,
    update_text: body.update_text,
  });

  if (error) return NextResponse.json({ ok: false, error });

  return NextResponse.json({ ok: true });
}
