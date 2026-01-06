import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase/server";
import dayjs from "dayjs";

export async function GET() {
  const supabase = supabaseService();
  const today = dayjs().startOf("day").toISOString();

  const [
    ready,
    scheduled,
    inProgress,
    waitingParts,
    completed
  ] = await Promise.all([
    supabase.from("service_requests").select("*", { count: "exact", head: true }).eq("status", "READY_TO_SCHEDULE"),
    supabase.from("service_requests").select("*", { count: "exact", head: true }).gte("scheduled_at", today),
    supabase.from("service_requests").select("*", { count: "exact", head: true }).eq("status", "IN_PROGRESS"),
    supabase.from("service_requests").select("*", { count: "exact", head: true }).not("waiting_for_parts_at", "is", null),
    supabase.from("service_requests").select("*", { count: "exact", head: true }).gte("completed_at", today),
  ]);

  return NextResponse.json({
    ok: true,
    metrics: {
      ready: ready.count || 0,
      scheduled: scheduled.count || 0,
      inProgress: inProgress.count || 0,
      waitingParts: waitingParts.count || 0,
      completed: completed.count || 0,
    },
  });
}
