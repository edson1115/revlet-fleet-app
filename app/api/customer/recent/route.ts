import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await supabaseServer();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false });

  const { data } = await supabase
    .from("service_requests")
    .select("*, vehicle:vehicles(*)")
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  return NextResponse.json({ ok: true, rows: data || [] });
}
