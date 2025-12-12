import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { ruleEngine } from "@/app/api/ai/anomaly/rules";
import { clusterEngine } from "@/app/api/ai/anomaly/cluster";
import { aiEngine } from "@/app/api/ai/anomaly/ai";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (n) => cookieStore.get(n)?.value,
        set: (n, v, o) => cookieStore.set(n, v, o),
        remove: (n, o) => cookieStore.delete(n, o),
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" });

  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  const { data: health } = await supabase
    .from("vehicle_health")
    .select("*")
    .eq("vehicle_id", id)
    .maybeSingle();

  const { data: faults } = await supabase
    .from("vehicle_faults")
    .select("*")
    .eq("vehicle_id", id)
    .order("created_at", { ascending: false });

  const { data: groupStats } = await supabase.rpc(
    "get_group_stats",
    { groupname: vehicle?.group_name || null }
  );

  const rules = ruleEngine(health, faults);
  const cluster = clusterEngine(vehicle, groupStats);
  const ai = await aiEngine(vehicle, faults, health);

  return NextResponse.json({
    ok: true,
    alerts: [
      ...rules.alerts,
      ...cluster.alerts,
      ...(ai.ai_alerts || []),
    ],
    predictions: ai.predictions,
    confidence: ai.confidence,
  });
}
