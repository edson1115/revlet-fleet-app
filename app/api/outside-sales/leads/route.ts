import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user)
    return NextResponse.json({ ok: false, error: "Unauthorized" });

  const { data, error } = await supabase
    .from("sales_leads")
    .select("*")
    .eq("rep_id", user.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ ok: true, rows: data });
}
