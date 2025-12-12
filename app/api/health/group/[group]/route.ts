import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(
  req: Request,
  context: { params: Promise<{ group: string }> }
) {
  const { group } = await context.params;
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: (n, v, o) => cookieStore.set(n, v, o),
        remove: (n, o) => cookieStore.delete(n, o),
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ ok: false, error: "Unauthorized" });

  const { data: profile } = await supabase
    .from("profiles")
    .select("customer_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.customer_id)
    return NextResponse.json({ ok: false, error: "Forbidden" });

  // GET VEHICLES FOR GROUP
  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("id")
    .eq("customer_id", profile.customer_id)
    .eq("group_name", group);

  if (!vehicles || vehicles.length === 0)
    return NextResponse.json({ ok: true, group, avg: null });

  const ids = vehicles.map((v) => v.id);

  // GET HEALTH SCORES
  const { data: scores } = await supabase
    .from("vehicle_health")
    .select("health_score")
    .in("vehicle_id", ids);

  const avg = scores.reduce((a, b) => a + b.health_score, 0) / scores.length;

  return NextResponse.json({
    ok: true,
    group,
    avg: Math.round(avg),
    count: scores.length,
  });
}
