import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await supabaseServer();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, reason: "unauthorized" });

  const { data: v } = await supabase
    .from("vehicles")
    .select("id", { count: "exact" })
    .eq("customer_id", user.id);

  const { data: r } = await supabase
    .from("service_requests")
    .select("id", { count: "exact" })
    .eq("customer_id", user.id)
    .not("status", "eq", "COMPLETED");

  return NextResponse.json({
    vehicles: v?.length ?? 0,
    open_requests: r?.length ?? 0,
  });
}
