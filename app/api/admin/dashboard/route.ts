import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getUserAndRole } from "@/lib/supabase/server-helpers";

// Fix: Define allowed roles locally to avoid type conflict with the imported string constant
const ALLOWED_ROLES = ["admin", "manager", "executive", "sales", "support"];

export async function GET() {
  const { user, role } = await getUserAndRole();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  // Fix: Use .includes() on our local array instead of .has()
  if (!role || !ALLOWED_ROLES.includes(role)) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const supabase = await supabaseServer();

  try {
    // ----- TOTAL COUNTS -----
    const [custRes, vehRes] = await Promise.all([
      supabase.from("customers").select("*", { count: "exact", head: true }),
      supabase.from("vehicles").select("*", { count: "exact", head: true }),
    ]);

    // ----- OPEN REQUESTS -----
    const { count: total_open_requests } = await supabase
      .from("service_requests")
      .select("*", { count: "exact", head: true })
      .neq("status", "COMPLETED");

    // ----- COMPLETED TODAY -----
    const todayStr = new Date().toISOString().split("T")[0];
    const { count: requests_completed_today } = await supabase
      .from("service_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "COMPLETED")
      .gte("completed_at", `${todayStr}T00:00:00Z`);

    // ----- MARKET LEADERBOARD -----
    // We use a safe fallback in case the RPC function doesn't exist yet
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
        total_customers: custRes.count || 0,
        total_vehicles: vehRes.count || 0,
        total_open_requests: total_open_requests || 0,
        requests_completed_today: requests_completed_today || 0,
        market_stats: markets || [],
        activity: activity || [],
      },
    });

  } catch (error) {
    console.error("Dashboard API Error:", error);
    // Return empty data structure on error so frontend doesn't crash
    return NextResponse.json({
      ok: true,
      data: {
        total_customers: 0,
        total_vehicles: 0,
        total_open_requests: 0,
        requests_completed_today: 0,
        market_stats: [],
        activity: [],
      }
    });
  }
}