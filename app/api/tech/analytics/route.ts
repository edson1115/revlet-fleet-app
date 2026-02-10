import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await supabaseServer();

    // Authenticate tech user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const techId = user.id;

    // Date calculations (Native JS to avoid dependency issues)
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    
    const weekStartObj = new Date(now);
    weekStartObj.setDate(now.getDate() - now.getDay()); // Sunday as start
    weekStartObj.setHours(0, 0, 0, 0);
    const weekStart = weekStartObj.toISOString();

    const sevenDaysAgoObj = new Date(now);
    sevenDaysAgoObj.setDate(now.getDate() - 6);
    sevenDaysAgoObj.setHours(0, 0, 0, 0);
    const sevenDaysAgo = sevenDaysAgoObj.toISOString();

    // ----------------------------------------------------------------------
    // 1. COMPLETED TODAY
    // ----------------------------------------------------------------------
    // FIX: Changed 'tech_id' to 'technician_id' to match schema
    const { count: todayCompleted } = await supabase
      .from("service_requests")
      .select("*", { count: "exact", head: true })
      .eq("technician_id", techId)
      .eq("status", "COMPLETED")
      .gte("completed_at", todayStart);

    // ----------------------------------------------------------------------
    // 2. COMPLETED THIS WEEK
    // ----------------------------------------------------------------------
    const { count: weekCompleted } = await supabase
      .from("service_requests")
      .select("*", { count: "exact", head: true })
      .eq("technician_id", techId)
      .eq("status", "COMPLETED")
      .gte("completed_at", weekStart);

    // ----------------------------------------------------------------------
    // 3. AVERAGE COMPLETION TIME (in minutes)
    // ----------------------------------------------------------------------
    const { data: durationRows } = await supabase
      .from("service_requests")
      .select("started_at, completed_at")
      .eq("technician_id", techId)
      .eq("status", "COMPLETED")
      .not("started_at", "is", null)
      .not("completed_at", "is", null)
      .limit(100);

    let avgCompletionTime = 0;

    // FIX: Safe check for array existence
    if (durationRows && durationRows.length > 0) {
      const durations = durationRows
        .map((r) => {
          if (!r.started_at || !r.completed_at) return 0;
          const start = new Date(r.started_at).getTime();
          const end = new Date(r.completed_at).getTime();
          return (end - start) / 1000 / 60; // minutes
        })
        .filter(d => d > 0 && d < 1440); // Filter valid positive durations under 24h

      if (durations.length > 0) {
        avgCompletionTime = Math.round(
          durations.reduce((a, b) => a + b, 0) / durations.length
        );
      }
    }

    // ----------------------------------------------------------------------
    // 4. TOTAL PHOTOS (assuming table uses request_id, joining via requests might be better but checking direct ID for now)
    // ----------------------------------------------------------------------
    // Note: If request_images doesn't have technician_id, this count might fail or need a join. 
    // Assuming 'technician_id' exists based on your previous code pattern.
    const { count: totalPhotos } = await supabase
      .from("request_images")
      .select("*", { count: "exact", head: true })
      .eq("technician_id", techId); 

    // ----------------------------------------------------------------------
    // 5. CHART DATA — LAST 7 DAYS
    // ----------------------------------------------------------------------
    const { data: chartRows } = await supabase
      .from("service_requests")
      .select("completed_at")
      .eq("technician_id", techId)
      .eq("status", "COMPLETED")
      .gte("completed_at", sevenDaysAgo);

    const chartData = new Array(7).fill(0);
    const labels: string[] = [];

    // Build labels for last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      labels.push(d.toLocaleDateString("en-US", { weekday: "short" }));
      
      const dateStr = d.toISOString().split("T")[0]; // YYYY-MM-DD

      const count = chartRows?.filter(
        (r) => r.completed_at?.startsWith(dateStr)
      ).length;

      chartData[6 - i] = count || 0;
    }

    // ----------------------------------------------------------------------
    // RESPONSE
    // ----------------------------------------------------------------------
    return NextResponse.json({
      ok: true,
      stats: {
        todayCompleted: todayCompleted || 0,
        weekCompleted: weekCompleted || 0,
        avgCompletionTime,
        totalPhotos: totalPhotos || 0,
        damageRate: 0, // Placeholder
        partsUsed: 0, // Placeholder
        chart: {
          labels,
          values: chartData,
        },
      },
    });

  } catch (err: any) {
    console.error("Analytics API Error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}