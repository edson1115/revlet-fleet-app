import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import dayjs from "dayjs";

export async function GET() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  
  // 1. MANUAL TOKEN PARSING (Matches Layout Logic)
  let accessToken = null;
  const authCookie = allCookies.find(c => c.name.includes("-auth-token"));

  if (authCookie) {
    try {
      let rawValue = authCookie.value;
      if (rawValue.startsWith("base64-")) {
        rawValue = rawValue.replace("base64-", "");
        rawValue = Buffer.from(rawValue, 'base64').toString('utf-8');
      }
      rawValue = decodeURIComponent(rawValue);
      const sessionData = JSON.parse(rawValue);
      accessToken = sessionData.access_token;
    } catch (e) {
      console.error("API Auth Parse Error:", e);
    }
  }

  if (!accessToken) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  // 2. INITIALIZE SUPABASE WITH AUTH
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${accessToken}` } }
    }
  );

  // AUTH VERIFICATION
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const role = user.user_metadata?.role;
  const allowedRoles = ["ADMIN", "SUPERADMIN", "SUPER_ADMIN"];
  if (!allowedRoles.includes(role)) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  // TIME WINDOWS
  const todayStart = dayjs().startOf("day").toISOString();
  const weekStart = dayjs().startOf("week").toISOString();
  const sevenDaysAgo = dayjs().subtract(6, "day").startOf("day").toISOString();

  // 1. JOBS COMPLETED TODAY
  const { count: jobsToday } = await supabase
    .from("service_requests")
    .select("*", { count: "exact", head: true })
    .gte("completed_at", todayStart);

  // 2. JOBS COMPLETED THIS WEEK
  const { count: jobsWeek } = await supabase
    .from("service_requests")
    .select("*", { count: "exact", head: true })
    .gte("completed_at", weekStart);

  // 3. ACTIVE CUSTOMERS
  const { count: customers } = await supabase
    .from("customers")
    .select("*", { count: "exact", head: true })
    .eq("status", "ACTIVE"); // Changed from 'active: true' to match your previous schema

  // 4. ACTIVE VEHICLES
  const { count: vehicles } = await supabase
    .from("vehicles")
    .select("*", { count: "exact", head: true })
    .eq("status", "ACTIVE");

  // 5. AVERAGE COMPLETION TIME
  const { data: durations } = await supabase
    .from("service_requests")
    .select("started_at, completed_at")
    .not("started_at", "is", null)
    .not("completed_at", "is", null);

  let avgCompletion = null;
  if (durations?.length) {
    const times = durations.map((r) => {
      const start = new Date(r.started_at!).getTime();
      const end = new Date(r.completed_at!).getTime();
      return (end - start) / 1000 / 60; // minutes
    });
    avgCompletion = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
  }

  // 6. PHOTOS UPLOADED TODAY
  const { count: photosToday } = await supabase
    .from("request_images")
    .select("*", { count: "exact", head: true })
    .gte("created_at", todayStart);

  // 7. TECH AVAILABILITY
  const { data: techList } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .in("role", ["TECH", "TECHNICIAN"])
    .eq("active", true);

  const availability = [];
  for (const t of techList || []) {
    const { count: activeJobs } = await supabase
      .from("service_requests")
      .select("*", { count: "exact", head: true })
      .eq("tech_id", t.id)
      .is("completed_at", null);

    availability.push({
      id: t.id,
      name: t.full_name || "Tech",
      activeJobs: activeJobs || 0,
    });
  }

  // 8. LAST 7 DAYS JOB CHART
  const { data: recentJobs } = await supabase
    .from("service_requests")
    .select("completed_at")
    .gte("completed_at", sevenDaysAgo);

  const chartLabels = [];
  const chartValues = [];

  for (let i = 6; i >= 0; i--) {
    const day = dayjs().subtract(i, "day");
    const label = day.format("dd");
    const dayStr = day.format("YYYY-MM-DD");

    const count = recentJobs?.filter((j) => j.completed_at?.startsWith(dayStr)).length || 0;

    chartLabels.push(label);
    chartValues.push(count);
  }

  return NextResponse.json({
    ok: true,
    stats: {
      jobsToday: jobsToday || 0,
      jobsWeek: jobsWeek || 0,
      customers: customers || 0,
      vehicles: vehicles || 0,
      avgCompletion,
      photosToday: photosToday || 0,
      techAvailability: availability,
      chart: {
        labels: chartLabels,
        values: chartValues,
      },
    },
  });
}