import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getUserAndRole, INTERNAL } from "@/lib/supabase/server-helpers";

export async function GET() {
  const { user, role } = await getUserAndRole();

  if (!user)
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  if (!role || !INTERNAL.has(role))
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const supabase = await supabaseServer();

  // ----- TOTAL COUNTS -----
  const [{ count: total_customers }, { count: total_vehicles }] = await Promise.all([
    supabase.from("customers").select("*", { count: "exact", head: true }),
    supabase.from("vehicles").select("*", { count: "exact", head: true }),
  ]);

  // ----- OPEN REQUESTS -----
  const { count: total_open_requests } = await supabase
    .from("service_requests")
    .select("*", { count: "exact", head: true })
    .neq("status", "COMPLETED");

  // ----- COMPLETED TODAY -----
  const { count: requests_completed_today } = await supabase
    .from("service_requests")
    .select("*", { count: "exact", head: true })
    .eq("status", "COMPLETED")
    .gte("completed_at", new Date().toISOString().split("T")[0] + "T00:00:00Z");

  // ----- MARKET LEADERBOARD -----
  const { data: markets } = await supabase.rpc("get_market_dashboard_stats");

  // ----- ACTIVITY FEED -----
  const { data: activity } = await supabase
    .from("activity_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  return NextResponse.json({
    ok: true,
    data: {
      total_customers,
      total_vehicles,
      total_open_requests,
      requests_completed_today,
      market_stats: markets ?? [],
      activity: activity ?? [],
    },
  });
}
