import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import dayjs from "dayjs";

export async function GET() {
  const supabase = await supabaseServer();

  // AUTH CHECK
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user)
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const role = user.user_metadata?.role;
  if (!["ADMIN", "SUPERADMIN"].includes(role))
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });

  // ============================================================
  // LOAD ALL MARKETS
  // ============================================================
  const { data: markets } = await supabase
    .from("markets")
    .select("id, name, active");

  if (!markets)
    return NextResponse.json({ ok: true, markets: [] });

  const todayStart = dayjs().startOf("day").toISOString();
  const weekStart = dayjs().startOf("week").toISOString();

  const results: any[] = [];

  for (const market of markets) {
    const marketId = market.id;

    // ------------------------------------------------------------
    // JOBS TODAY
    // ------------------------------------------------------------
    const { count: jobsToday } = await supabase
      .from("service_requests")
      .select("*", { count: "exact", head: true })
      .eq("market_id", marketId)
      .gte("completed_at", todayStart);

    // ------------------------------------------------------------
    // JOBS THIS WEEK
    // ------------------------------------------------------------
    const { count: jobsWeek } = await supabase
      .from("service_requests")
      .select("*", { count: "exact", head: true })
      .eq("market_id", marketId)
      .gte("completed_at", weekStart);

    // ------------------------------------------------------------
    // ACTIVE TECHS
    // ------------------------------------------------------------
    const { count: techs } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "TECH")
      .eq("active", true)
      .eq("market_id", marketId);

    // ------------------------------------------------------------
    // ACTIVE CUSTOMERS
    // ------------------------------------------------------------
    const { count: customers } = await supabase
      .from("customers")
      .select("*", { count: "exact", head: true })
      .eq("active", true)
      .eq("market", market.name);

    // ------------------------------------------------------------
    // VEHICLES
    // ------------------------------------------------------------
    const { count: vehicles } = await supabase
      .from("vehicles")
      .select("*", { count: "exact", head: true })
      .eq("market_id", marketId)
      .eq("active", true);

    // ------------------------------------------------------------
    // PERFORMANCE GRADE
    // ------------------------------------------------------------
    let performance = "B";
    if ((jobsToday || 0) > 10) performance = "A";
    if ((jobsToday || 0) < 3) performance = "C";

    results.push({
      id: marketId,
      name: market.name,
      today: jobsToday || 0,
      week: jobsWeek || 0,
      techs: techs || 0,
      customers: customers || 0,
      vehicles: vehicles || 0,
      performance,
    });
  }

  return NextResponse.json({ ok: true, markets: results });
}
