import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { ruleEngine } from "@/app/api/ai/anomaly/rules";
import { clusterEngine } from "@/app/api/ai/anomaly/cluster";
import { aiEngine } from "@/app/api/ai/anomaly/ai";

export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const id = params.id;

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
            // Ignored
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  // 1. Fetch Vehicle
  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  // 2. Fetch Health Data
  const { data: health } = await supabase
    .from("vehicle_health")
    .select("*")
    .eq("vehicle_id", id)
    .maybeSingle();

  // 3. Fetch Faults
  const { data: faults } = await supabase
    .from("vehicle_faults")
    .select("*")
    .eq("vehicle_id", id)
    .order("created_at", { ascending: false });

  // 4. Fetch Group Stats (RPC)
  let groupStats = null;
  if (vehicle?.group_name) {
    const { data } = await supabase.rpc("get_group_stats", {
      groupname: vehicle.group_name,
    });
    groupStats = data;
  }

  // 5. Run Engines
  const rules = ruleEngine(health, faults);
  const cluster = clusterEngine(vehicle, groupStats);
  const ai = await aiEngine(vehicle, faults, health);

  return NextResponse.json({
    ok: true,
    alerts: [
      ...(rules?.alerts || []),
      ...(cluster?.alerts || []),
      ...(ai?.ai_alerts || []),
    ],
    predictions: ai?.predictions || [],
    confidence: ai?.confidence || 0,
  });
}