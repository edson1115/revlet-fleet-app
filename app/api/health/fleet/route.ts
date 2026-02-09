import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();

  // FIX: Use modern getAll/setAll pattern for Supabase SSR + Next.js 15
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  // Check profile for customer_id
  const { data: profile } = await supabase
    .from("profiles")
    .select("customer_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.customer_id) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  // GET VEHICLE IDs
  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("id")
    .eq("customer_id", profile.customer_id);

  if (!vehicles || vehicles.length === 0) {
    return NextResponse.json({ ok: true, fleet_avg: null, count: 0 });
  }

  const ids = vehicles.map((v) => v.id);

  // Fetch health scores
  const { data: scores } = await supabase
    .from("vehicle_health")
    .select("health_score")
    .in("vehicle_id", ids);

  const safeScores = scores || [];
  
  if (safeScores.length === 0) {
     return NextResponse.json({ ok: true, fleet_avg: null, count: 0 });
  }

  const avg = safeScores.reduce((sum, s) => sum + (s.health_score || 0), 0) / safeScores.length;

  return NextResponse.json({
    ok: true,
    fleet_avg: Math.round(avg),
    count: safeScores.length,
  });
}