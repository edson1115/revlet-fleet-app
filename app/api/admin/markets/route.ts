import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import dayjs from "dayjs";

export async function GET() {
  const cookieStore = await cookies();
  
  // 1. MANUAL AUTH OVERRIDE
  const authCookie = cookieStore.getAll().find(c => c.name.includes("-auth-token"));
  
  if (!authCookie) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let val = authCookie.value;
  if (val.startsWith("base64-")) {
    val = Buffer.from(val.replace("base64-", ""), 'base64').toString('utf-8');
  }
  
  const parsed = JSON.parse(decodeURIComponent(val));
  const token = parsed.access_token;

  if (!token) {
    return NextResponse.json({ ok: false, error: "Token Missing" }, { status: 401 });
  }

  // 2. INITIALIZE AUTHENTICATED CLIENT
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user)
    return NextResponse.json({ ok: false, error: "Invalid Session" }, { status: 401 });

  const role = user.user_metadata?.role;
  if (!["ADMIN", "SUPERADMIN", "SUPER_ADMIN"].includes(role))
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });

  // ============================================================
  // LOAD ALL MARKETS
  // ============================================================
  const { data: markets } = await supabase
    .from("markets")
    .select("id, name, active");

  if (!markets)
    return NextResponse.json({ ok: true, markets: [] });

  const todayStart = dayjs().startOf("day").toISOString();
  const weekStart = dayjs().startOf("week").toISOString();

  const results: any[] = [];

  for (const market of markets) {
    const marketId = market.id;

    // Standard Metrics
    const { count: jobsToday } = await supabase.from("service_requests").select("*", { count: "exact", head: true }).eq("market_id", marketId).eq("status", "COMPLETED").gte("completed_at", todayStart);
    const { count: jobsWeek } = await supabase.from("service_requests").select("*", { count: "exact", head: true }).eq("market_id", marketId).eq("status", "COMPLETED").gte("completed_at", weekStart);
    const { count: techs } = await supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "TECH").eq("active", true).eq("market_id", marketId);
    const { count: customers } = await supabase.from("customers").select("*", { count: "exact", head: true }).eq("active", true).eq("market", market.name);
    const { count: vehicles } = await supabase.from("vehicles").select("*", { count: "exact", head: true }).eq("market_id", marketId).eq("active", true);

    // 🏆 NEW: TECHNICIAN PERFORMANCE (Leaderboard Data)
    const { data: techData } = await supabase
      .from("profiles")
      .select(`
        id, 
        full_name, 
        service_requests!inner(id, status, created_at, completed_at)
      `)
      .eq("role", "TECH")
      .eq("market_id", marketId)
      .eq("active", true)
      .eq("service_requests.status", "COMPLETED");

    const technicianLeaderboard = (techData || []).map((t: any) => {
      const jobs = t.service_requests || [];
      const totalMinutes = jobs.reduce((acc: number, job: any) => {
        const start = dayjs(job.created_at);
        const end = dayjs(job.completed_at);
        return acc + end.diff(start, "minute");
      }, 0);

      return {
        id: t.id,
        name: t.full_name,
        market: market.name,
        jobsCompleted: jobs.length,
        avgTime: jobs.length > 0 ? Math.round(totalMinutes / jobs.length) : 0
      };
    });

    results.push({
      id: marketId,
      name: market.name,
      today: jobsToday || 0,
      week: jobsWeek || 0,
      techs: techs || 0,
      customers: customers || 0,
      vehicles: vehicles || 0,
      performance: (jobsToday || 0) > 10 ? "A" : (jobsToday || 0) < 3 ? "C" : "B",
      technicianLeaderboard
    });
  }

  return NextResponse.json({ ok: true, markets: results });
}