import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server"; // FIX: Correct import

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth?.user?.id;

  if (!uid) return NextResponse.json({});

  // 1. Get Customer ID
  // Trying both 'profiles' link and direct 'customers' link for safety
  let customerId = null;

  // Strategy A: Check profiles table (User's provided code)
  const { data: prof } = await supabase
    .from("profiles")
    .select("customer_id")
    .eq("id", uid)
    .maybeSingle();
  
  if (prof?.customer_id) {
    customerId = prof.customer_id;
  } else {
    // Strategy B: Fallback to finding customer by email (Standard pattern)
    const { data: cust } = await supabase
        .from("customers")
        .select("id")
        .eq("email", auth.user?.email)
        .maybeSingle();
    customerId = cust?.id;
  }

  if (!customerId) return NextResponse.json({});

  // 2. Fetch Requests
  const { data: reqs } = await supabase
    .from("service_requests")
    .select("service_title, created_at, scheduled_at, started_at, completed_at") // Note: service_title matches your schema better than 'service'
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (!reqs) return NextResponse.json({});

  // Helper: Calculate minutes between two ISO strings
  function mins(a: string | null, b: string | null) {
    if (!a || !b) return null;
    const diff = (new Date(b).getTime() - new Date(a).getTime()) / 1000 / 60;
    return isNaN(diff) ? null : diff; // FIX: Handle invalid dates (NaN)
  }

  const responseTimes: number[] = [];
  const dispatchTimes: number[] = [];
  const completionTimes: number[] = [];
  let slaHits = 0;
  let totalCompleted = 0;

  const breakdownMap: Record<string, { sum: number; count: number }> = {};

  for (const r of reqs) {
    const resp = mins(r.created_at, r.scheduled_at);
    const disp = mins(r.scheduled_at, r.started_at);
    const comp = mins(r.created_at, r.completed_at);

    if (resp !== null) responseTimes.push(resp);
    if (disp !== null) dispatchTimes.push(disp);

    if (comp !== null) {
      completionTimes.push(comp);
      totalCompleted++;

      if (comp <= 24 * 60) slaHits++; // SLA: 24 hours

      // Use service_title or fallback
      const key = r.service_title || "General";
      
      if (!breakdownMap[key]) {
        breakdownMap[key] = { sum: 0, count: 0 };
      }
      breakdownMap[key].sum += comp;
      breakdownMap[key].count += 1;
    }
  }

  const service_breakdown = Object.keys(breakdownMap).map((k) => ({
    service: k,
    avg_minutes: Math.round(breakdownMap[k].sum / breakdownMap[k].count),
    count: breakdownMap[k].count,
  }));

  return NextResponse.json({
    avg_response_minutes:
      responseTimes.length ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) : 0,
    avg_dispatch_minutes:
      dispatchTimes.length ? Math.round(dispatchTimes.reduce((a, b) => a + b, 0) / dispatchTimes.length) : 0,
    avg_completion_minutes:
      completionTimes.length ? Math.round(completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length) : 0,
    sla_compliance:
      totalCompleted ? Math.round((slaHits / totalCompleted) * 100) : 100,
    service_breakdown,
    daily_counts: [],
    vehicle_breakdown: [],
  });
}