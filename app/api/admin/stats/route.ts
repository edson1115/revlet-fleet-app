import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1. Get total shared reports this week
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const { count: sharedCount } = await supabase
    .from("fleet_events")
    .select('*', { count: 'exact', head: true })
    .eq("event_type", "REPORT_SHARED_SMS")
    .gte("created_at", oneWeekAgo.toISOString());

  // 2. Get average Fleet Health Score
  const { data: scores } = await supabase
    .from("fleet_intelligence_scores")
    .select("score_value")
    .eq("score_type", "health");

  const avgHealth = scores?.length 
    ? Math.round(scores.reduce((acc, s) => acc + s.score_value, 0) / scores.length) 
    : 100;

  return NextResponse.json({
    sharedReportsWeek: sharedCount || 0,
    fleetHealth: avgHealth,
    activePilots: 1 // San Antonio
  });
}