import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import dayjs from "dayjs";

export async function GET() {
  const supabase = await supabaseServer();

  // Authenticate tech user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user)
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const techId = user.id;

  const todayStart = dayjs().startOf("day").toISOString();
  const weekStart = dayjs().startOf("week").toISOString();
  const sevenDaysAgo = dayjs().subtract(6, "day").startOf("day").toISOString();

  // ----------------------------------------------------------------------
  // 1. COMPLETED TODAY
  // ----------------------------------------------------------------------
  const { count: todayCompleted } = await supabase
    .from("service_requests")
    .select("*", { count: "exact", head: true })
    .eq("tech_id", techId)
    .gte("completed_at", todayStart);

  // ----------------------------------------------------------------------
  // 2. COMPLETED THIS WEEK
  // ----------------------------------------------------------------------
  const { count: weekCompleted } = await supabase
    .from("service_requests")
    .select("*", { count: "exact", head: true })
    .eq("tech_id", techId)
    .gte("completed_at", weekStart);

  // ----------------------------------------------------------------------
  // 3. AVERAGE COMPLETION TIME (in minutes)
  // ----------------------------------------------------------------------
  const { data: durationRows } = await supabase
    .from("service_requests")
    .select("started_at, completed_at")
    .eq("tech_id", techId)
    .not("started_at", "is", null)
    .not("completed_at", "is", null);

  let avgCompletionTime = null;

  if (durationRows?.length > 0) {
    const durations = durationRows.map((r) => {
      const start = new Date(r.started_at).getTime();
      const end = new Date(r.completed_at).getTime();
      return (end - start) / 1000 / 60; // minutes
    });
    avgCompletionTime = Math.round(
      durations.reduce((a, b) => a + b, 0) / durations.length
    );
  }

  // ----------------------------------------------------------------------
  // 4. TOTAL PHOTOS
  // ----------------------------------------------------------------------
  const { count: totalPhotos } = await supabase
    .from("request_images")
    .select("*", { count: "exact", head: true })
    .eq("tech_id", techId);

  // ----------------------------------------------------------------------
  // 5. DAMAGE DETECTION RATE (optional)
  // ----------------------------------------------------------------------
  const { data: damageRows } = await supabase
    .from("ai_damage_reports")
    .select("id, severity")
    .eq("tech_id", techId);

  const damageCount = damageRows?.length || 0;
  const damageRate =
    totalPhotos && totalPhotos > 0
      ? Math.round((damageCount / totalPhotos) * 100)
      : 0;

  // ----------------------------------------------------------------------
  // 6. PARTS USED
  // ----------------------------------------------------------------------
  const { data: partRows } = await supabase
    .from("request_parts")
    .select("quantity")
    .eq("tech_id", techId);

  const partsUsed =
    partRows?.reduce((sum, r) => sum + (r.quantity || 0), 0) || 0;

  // ----------------------------------------------------------------------
  // 7. CHART DATA — LAST 7 DAYS
  // ----------------------------------------------------------------------
  const { data: chartRows } = await supabase
    .from("service_requests")
    .select("completed_at")
    .eq("tech_id", techId)
    .gte("completed_at", sevenDaysAgo);

  const chartData = Array(7).fill(0);
  const labels = [];

  for (let i = 6; i >= 0; i--) {
    const day = dayjs().subtract(i, "day");
    labels.push(day.format("dd"));
    const dateStr = day.format("YYYY-MM-DD");

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
      damageRate,
      partsUsed,
      chart: {
        labels,
        values: chartData,
      },
    },
  });
}
