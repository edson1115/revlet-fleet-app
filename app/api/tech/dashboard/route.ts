// app/api/tech/dashboard/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await supabaseServer();

    // ---------------------------------------------------
    // 1) GET CURRENT USER
    // ---------------------------------------------------
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json(
        { ok: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const techId = user.id;

    // ---------------------------------------------------
    // 2) GET TODAY'S DATE RANGE
    // ---------------------------------------------------
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0
    ).toISOString();

    // Only counting jobs created today or in-progress/completed today
    const todayFilter = `created_at.gte.${startOfDay}`;

    // ---------------------------------------------------
    // 3) LOAD TECH'S JOBS — assigned_tech_id
    // ---------------------------------------------------
    const { data: jobs, error: jobsErr } = await supabase
      .from("service_requests")
      .select(
        `
        id,
        status,
        service,
        scheduled_start_at,
        scheduled_end_at,
        started_at,
        completed_at,

        vehicle:vehicles (
          id,
          year,
          make,
          model,
          unit_number,
          plate
        ),

        customer:customers (
          id,
          name
        )
      `
      )
      .eq("assigned_tech_id", techId)
      .order("scheduled_start_at", { ascending: true });

    if (jobsErr) {
      return NextResponse.json(
        { ok: false, error: "Failed loading jobs", details: jobsErr.message },
        { status: 500 }
      );
    }

    // ---------------------------------------------------
    // 4) COUNT TODAY'S STATS
    // ---------------------------------------------------
    const { data: todayStats, error: statsErr } = await supabase.rpc(
      "tech_dashboard_stats",
      { tech_uid: techId, start_ts: startOfDay }
    );

    if (statsErr) {
      // Fallback if RPC not created yet
      const totalToday = jobs.filter(
        (j) => j.created_at >= startOfDay
      ).length;

      const inProgress = jobs.filter(
        (j) => j.status === "IN_PROGRESS"
      ).length;

      const completedToday = jobs.filter(
        (j) => j.completed_at && j.completed_at >= startOfDay
      ).length;

      return NextResponse.json({
        ok: true,
        stats: {
          total_today: totalToday,
          in_progress: inProgress,
          completed_today: completedToday,
        },
        jobs,
      });
    }

    // ---------------------------------------------------
    // 5) SUCCESS
    // ---------------------------------------------------
    return NextResponse.json({
      ok: true,
      stats: todayStats,
      jobs,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
