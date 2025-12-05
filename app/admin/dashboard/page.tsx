// app/api/admin/dashboard/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET() {
  const supabase = supabaseServer();

  // ------------------------------------
  // AUTH: Must be SUPERADMIN
  // ------------------------------------
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "SUPERADMIN") {
    return NextResponse.json(
      { ok: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  // ------------------------------------
  // STATS (counts from database)
  // ------------------------------------
  const { data: totalRequests } = await supabase
    .from("service_requests")
    .select("id", { count: "exact", head: true });

  const { data: openRequests } = await supabase
    .from("service_requests")
    .select("id", { count: "exact", head: true })
    .in("status", ["NEW", "WAITING_TO_BE_SCHEDULED", "SCHEDULED", "IN_PROGRESS"]);

  const { data: completedToday } = await supabase
    .from("service_requests")
    .select("id", { count: "exact", head: true })
    .gte("completed_at", new Date().toISOString().split("T")[0] + "T00:00:00.000Z");

  const { data: customers } = await supabase
    .from("customers")
    .select("id", { count: "exact", head: true });

  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("id", { count: "exact", head: true });

  const { data: marketsList } = await supabase
    .from("profiles")
    .select("active_market");

  const uniqueMarkets = Array.from(
    new Set((marketsList || []).map((m) => m.active_market).filter(Boolean))
  );

  const stats = {
    total_requests: totalRequests || 0,
    open_requests: openRequests || 0,
    completed_today: completedToday || 0,
    customers: customers || 0,
    vehicles: vehicles || 0,
    markets: uniqueMarkets.length,
  };

  // ------------------------------------
  // ALL USERS
  // ------------------------------------
  const { data: users } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, active_market")
    .order("full_name", { ascending: true });

  // ------------------------------------
  // TECHS + STATUS
  // ------------------------------------
  const { data: techs } = await supabase
    .from("profiles")
    .select("id, full_name, active_market, tech_status")
    .eq("role", "TECH");

  // ------------------------------------
  // RECENT REQUESTS
  // ------------------------------------
  const { data: recent } = await supabase
    .from("service_requests")
    .select(
      `
      id,
      status,
      service,
      created_at,
      vehicle:vehicles (
        id,
        make,
        model,
        year
      )
    `
    )
    .order("created_at", { ascending: false })
    .limit(10);

  return NextResponse.json({
    ok: true,
    stats,
    users: users || [],
    techs: techs || [],
    recent_requests: recent || [],
  });
}
