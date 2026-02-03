// app/api/portal/metrics/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server-helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth?.user?.id;

  if (!uid) return NextResponse.json({});

  const { data: prof } = await supabase
    .from("profiles")
    .select("customer_id")
    .eq("id", uid)
    .maybeSingle();

  if (!prof?.customer_id) return NextResponse.json({});

  const customerId = prof.customer_id;

  const { data: reqs } = await supabase
    .from("service_requests")
    .select("service, created_at, scheduled_at, started_at, completed_at")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (!reqs) return NextResponse.json({});

  function mins(a: string | null, b: string | null) {
    if (!a || !b) return null;
    return (new Date(b).getTime() - new Date(a).getTime()) / 1000 / 60;
  }

  let responseTimes: number[] = [];
  let dispatchTimes: number[] = [];
  let completionTimes: number[] = [];
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

      if (comp <= 24 * 60) slaHits++;

      const key = r.service || "General";
      breakdownMap[key] = breakdownMap[key] || { sum: 0, count: 0 };
      breakdownMap[key].sum += comp;
      breakdownMap[key].count += 1;
    }
  }

  const service_breakdown = Object.keys(breakdownMap).map((k) => ({
    service: k,
    avg_minutes: breakdownMap[k].sum / breakdownMap[k].count,
    count: breakdownMap[k].count,
  }));

  return NextResponse.json({
    avg_response_minutes:
      responseTimes.length ? Math.round(responseTimes.reduce((a, b) => a + b) / responseTimes.length) : null,
    avg_dispatch_minutes:
      dispatchTimes.length ? Math.round(dispatchTimes.reduce((a, b) => a + b) / dispatchTimes.length) : null,
    avg_completion_minutes:
      completionTimes.length ? Math.round(completionTimes.reduce((a, b) => a + b) / completionTimes.length) : null,
    sla_compliance:
      totalCompleted ? Math.round((slaHits / totalCompleted) * 100) : null,
    service_breakdown,
    daily_counts: [],
    vehicle_breakdown: [],
  });
}



