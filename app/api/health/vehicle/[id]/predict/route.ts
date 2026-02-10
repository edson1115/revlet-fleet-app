import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
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

  if (!vehicle) {
    return NextResponse.json({ ok: false, error: "Vehicle not found" }, { status: 404 });
  }

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

  // 4. Run AI Engine for Predictions
  // Ensure faults is always an array to prevent crashes
  const ai = await aiEngine(vehicle, faults || [], health);

  return NextResponse.json({
    ok: true,
    predictions: ai?.predictions || [],
    confidence: ai?.confidence || 0,
    analysis: ai?.ai_alerts || []
  });
}