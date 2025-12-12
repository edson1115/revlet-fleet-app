import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import dayjs from "dayjs";

export async function GET(req: Request, ctx: any) {
  const marketId = ctx.params.id;
  const supabase = await supabaseServer();

  // AUTH
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user)
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const role = user.user_metadata?.role;
  if (!["ADMIN", "SUPERADMIN"].includes(role))
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });

  // MARKET INFO
  const { data: market } = await supabase
    .from("markets")
    .select("*")
    .eq("id", marketId)
    .maybeSingle();

  if (!market)
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

  // JOB COUNTS TODAY + WEEK
  const todayStart = dayjs().startOf("day").toISOString();
  const weekStart = dayjs().startOf("week").toISOString();

  const countQuery = (gte?: string) =>
    supabase
      .from("service_requests")
      .select("*", { count: "exact", head: true })
      .eq("market_id", marketId)
      .gte(gte ? "completed_at" : "id", gte || "")
      .then((r) => r.count || 0);

  const today = await countQuery(todayStart);
  const week = await countQuery(weekStart);

  // STATUS COUNTS
  const { data: statusRows } = await supabase
    .from("service_requests")
    .select("status")
    .eq("market_id", marketId);

  const statusCounts: any = {};
  statusRows?.forEach((r) => {
    statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
  });

  // ACTIVE TECHS
  const { data: techs } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "TECH")
    .eq("active", true)
    .eq("market_id", marketId);

  // CUSTOMERS
  const { data: customers } = await supabase
    .from("customers")
    .select("*")
    .eq("market", market.name);

  // VEHICLES
  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("*")
    .eq("market_id", marketId);

  // VEHICLE SUMMARY (for bar chart)
  const vehicleSummary: any = {};
  vehicles?.forEach((v) => {
    vehicleSummary[v.make] = (vehicleSummary[v.make] || 0) + 1;
  });

  // WEEK ACTIVITY FOR LINE CHART
  const { data: completions } = await supabase
    .from("service_requests")
    .select("completed_at")
    .eq("market_id", marketId)
    .not("completed_at", "is", null);

  const activityWeek = Array(7).fill(0);
  completions?.forEach((row) => {
    const dow = dayjs(row.completed_at).day();
    activityWeek[dow]++;
  });

  // PERFORMANCE SCORE
  let performance = "B";
  if (today > 10) performance = "A";
  if (today < 3) performance = "C";

  return NextResponse.json({
    ok: true,
    market,
    stats: {
      today,
      week,
      techs: techs?.length || 0,
      customers: customers?.length || 0,
      vehicles: vehicles?.length || 0,
      status_counts: statusCounts,
      activity_week: activityWeek,
      tech_list: techs || [],
      customer_list: customers || [],
      vehicle_summary: Object.entries(vehicleSummary).map(([make, count]) => ({
        make,
        count,
      })),
      performance,
    },
  });
}
