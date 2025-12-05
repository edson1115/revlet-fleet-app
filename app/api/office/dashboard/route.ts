import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { normalizeRole } from "@/lib/permissions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// ------------------------------------------------------------
// GET /api/office/dashboard
// ------------------------------------------------------------
export async function GET() {
  try {
    const supabase = await supabaseServer();

    // -------------------------------
    // AUTH
    // -------------------------------
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = normalizeRole(user.user_metadata?.role);

    const OFFICE_ROLES = new Set([
      "OFFICE",
      "DISPATCH",
      "ADMIN",
      "SUPERADMIN",
      "FLEET_MANAGER",
    ]);

    if (!role || !OFFICE_ROLES.has(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ------------------------------------------------------------
    // MARKET SCOPING — Uses user's active_market from profiles
    // ------------------------------------------------------------
    const { data: profile } = await supabase
      .from("profiles")
      .select("active_market")
      .eq("id", user.id)
      .maybeSingle();

    const active_market = profile?.active_market ?? "San Antonio";

    // ------------------------------------------------------------
    // TODAY METRICS
    // ------------------------------------------------------------
    const { data: today } = await supabase.rpc("sr_today_metrics", {
      market_input: active_market,
    });

    // ------------------------------------------------------------
    // TECH STATUS (today’s active workload)
    // ------------------------------------------------------------
    const { data: techs } = await supabase.rpc("sr_tech_status", {
      market_input: active_market,
    });

    // ------------------------------------------------------------
    // TOTAL CUSTOMERS (market-scoped)
    // ------------------------------------------------------------
    const { count: customers } = await supabase
      .from("customers")
      .select("*", { count: "exact", head: true })
      .eq("market", active_market);

    // ------------------------------------------------------------
    // TOTAL VEHICLES (market-scoped)
    // ------------------------------------------------------------
    const { count: vehicles } = await supabase
      .from("vehicles")
      .select("*", { count: "exact", head: true })
      .eq("market", active_market);

    // ------------------------------------------------------------
    // KPI: Aging Buckets
    // ------------------------------------------------------------
    const { data: aging } = await supabase.rpc("sr_aging_buckets", {
      market_input: active_market,
    });

    // ------------------------------------------------------------
    // KPI: Technician Productivity
    // ------------------------------------------------------------
    const { data: tech_kpi } = await supabase.rpc(
      "sr_technician_productivity",
      {
        market_input: active_market,
      }
    );

    // ------------------------------------------------------------
    // KPI: Average Completion Time (minutes)
    // ------------------------------------------------------------
    const { data: avg_time_row } = await supabase.rpc(
      "sr_average_completion_time",
      {
        market_input: active_market,
      }
    );

    const avg_time = avg_time_row?.avg_minutes ?? null;

    // ------------------------------------------------------------
    // FINAL RESPONSE
    // ------------------------------------------------------------
    return NextResponse.json({
      today: today ?? {},
      techs: techs ?? [],
      customers: customers ?? 0,
      vehicles: vehicles ?? 0,
      aging: aging ?? [],
      tech_kpi: tech_kpi ?? [],
      avg_time,
      market: active_market,
    });
  } catch (err: any) {
    console.error("DASHBOARD ERROR:", err);
    return NextResponse.json(
      { error: "Server error", detail: err.message },
      { status: 500 }
    );
  }
}



