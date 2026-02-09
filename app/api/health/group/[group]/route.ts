import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(
  req: Request,
  props: { params: Promise<{ group: string }> }
) {
  const params = await props.params;
  const cookieStore = await cookies();

  // FIX: Use the modern getAll/setAll pattern for Supabase SSR + Next.js 15
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
            // Ignored
          }
        },
      },
    }
  );

  // Check Auth
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const groupName = params.group;

  // Fetch Vehicles in this Group (Market)
  const { data: vehicles, error } = await supabase
    .from("vehicles")
    .select("status, health_status")
    .eq("market", groupName); // Assuming 'group' maps to 'market' column

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  // Calculate Health Metrics
  const total = vehicles?.length || 0;
  const active = vehicles?.filter(v => v.status === "ACTIVE").length || 0;
  const critical = vehicles?.filter(v => v.health_status === "CRITICAL").length || 0;
  const warning = vehicles?.filter(v => v.health_status === "WARNING").length || 0;
  const good = vehicles?.filter(v => v.health_status === "GOOD" || !v.health_status).length || 0;

  return NextResponse.json({
    ok: true,
    group: groupName,
    stats: {
      total,
      active,
      health_breakdown: {
        good,
        warning,
        critical
      }
    }
  });
}