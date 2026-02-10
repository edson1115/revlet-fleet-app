import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server"; // FIX: Correct import

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth?.user?.id;

  if (!uid) return NextResponse.json({});

  // 1. Get Customer ID
  // Try finding by profile first, then fallback to email
  let customerId = null;
  
  const { data: prof } = await supabase
    .from("profiles")
    .select("customer_id")
    .eq("id", uid)
    .maybeSingle();

  if (prof?.customer_id) {
    customerId = prof.customer_id;
  } else {
    const { data: cust } = await supabase
        .from("customers")
        .select("id")
        .eq("email", auth.user?.email)
        .maybeSingle();
    customerId = cust?.id;
  }

  if (!customerId) return NextResponse.json({});

  // 2. Load requests + vehicles
  // FIX: Changed 'service' to 'service_title' to match schema
  const { data: reqs } = await supabase
    .from("service_requests")
    .select("id, service_title, reported_mileage, vehicle_id, created_at, completed_at") 
    .eq("customer_id", customerId);

  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("id, year, make, model, unit_number, plate")
    .eq("customer_id", customerId);

  const totalVehicles = vehicles?.length || 0;

  // ======= KPI CALCULATIONS ========

  // uptime calc (Vehicles with no requests in last 30 days are "up")
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const activeVehicles = new Set(
    reqs
      ?.filter((r) => new Date(r.created_at) > thirtyDaysAgo)
      .map((r) => r.vehicle_id)
  );

  const uptime_percent =
    totalVehicles > 0
      ? Math.round(
          ((totalVehicles - activeVehicles.size) / totalVehicles) * 100
        )
      : 100;

  // failure rate (requests per 1000 miles)
  // Note: Summing odometers is unusual, but keeping your logic for now.
  let totalMiles = 0;
  let totalReqs = reqs?.length || 0;
  for (const r of reqs || []) {
    if (r.reported_mileage) totalMiles += r.reported_mileage;
  }

  const failure_rate =
    totalMiles > 0 ? Math.round((totalReqs / totalMiles) * 1000) : 0;

  // category breakdown
  const categoryMap: Record<string, number> = {
    Tires: 0,
    "Tire Rotation": 0,
    Brakes: 0,
    PM: 0,
    Battery: 0,
    Diagnostics: 0,
    Other: 0,
  };

  for (const r of reqs || []) {
    // FIX: Use service_title
    const s = (r.service_title || "").toLowerCase();

    if (s.includes("tire rotation")) categoryMap["Tire Rotation"]++;
    else if (s.includes("tire")) categoryMap["Tires"]++;
    else if (s.includes("brake")) categoryMap["Brakes"]++;
    else if (s.includes("oil") || s.includes("pm")) categoryMap["PM"]++;
    else if (s.includes("battery")) categoryMap["Battery"]++;
    else if (s.includes("diag")) categoryMap["Diagnostics"]++;
    else categoryMap["Other"]++;
  }

  // Vehicle health scores
  const health: Array<{ id: string; label: string; score: number }> = [];

  for (const v of vehicles || []) {
    const vReqs = reqs?.filter((r) => r.vehicle_id === v.id) || [];
    const issues = vReqs.length;

    let label =
      `${v.year ?? ""} ${v.make ?? ""} ${v.model ?? ""}`.trim() ||
      v.unit_number ||
      v.plate ||
      v.id;

    // scoring: 100 - (issues * 5)
    const score = Math.max(20, 100 - issues * 5);

    health.push({ id: v.id, label, score });
  }

  const problemVehicles = health
    .filter((v) => v.score < 70)
    .sort((a, b) => a.score - b.score)
    .slice(0, 10);

  return NextResponse.json({
    uptime_percent,
    failure_rate,
    category_breakdown: Object.keys(categoryMap).map((k) => ({
      category: k,
      count: categoryMap[k],
    })),
    vehicle_health: health,
    problem_vehicles: problemVehicles,
    mileage_trends: [],
    cost_trend: [],
  });
}