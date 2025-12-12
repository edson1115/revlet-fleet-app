import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user)
    return NextResponse.json({ ok: false, error: "Unauthorized" });

  const repId = user.id;

  const { data, error } = await supabase.rpc("sales_leads_stats", {
    rep_id: repId,
  });

  if (error)
    return NextResponse.json({ ok: false, error });

  return NextResponse.json({
    ok: true,
    total: data.total,
    converted: data.converted,
    active: data.active,
  });
}
