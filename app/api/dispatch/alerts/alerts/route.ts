import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase/server";

export async function GET() {
  const supabase = supabaseService();

  const { data, error } = await supabase
    .from("activity_log")
    .select(`
      id,
      created_at,
      action,
      actor_role,
      request_id,
      meta
    `)
    .order("created_at", { ascending: false })
    .limit(25);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, alerts: data });
}
