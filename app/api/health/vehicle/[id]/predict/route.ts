import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { computeWearPredictions } from "@/app/api/ai/predict/curves";
import { statisticalFailurePrediction } from "@/app/api/ai/predict/stats";
import { aiPredictiveModel } from "@/app/api/ai/predict/ai";

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

  const { data: usage } = await supabase
    .from("vehicle_usage")
    .select("*")
    .eq("vehicle_id", id)
    .maybeSingle();

  const { data: faults } = await supabase
    .from("vehicle_faults")
    .select("*")
    .eq("vehicle_id", id);

  // LAYER 1 — Wear curves
  const curves = computeWearPredictions(health, usage);

  // LAYER 2 — Statistical patterns
  const stats = statisticalFailurePrediction(vehicle, faults);

  // LAYER 3 — AI predictions
  const ai = await aiPredictiveModel(vehicle, faults, health);

  return NextResponse.json({
    ok: true,
    wear_predictions: curves.predictions,
    statistical_predictions: stats.predictions,
    ai_predictions: ai.predicted_failures,
    maintenance_due: ai.maintenance_due,
    hidden_risks: ai.hidden_risks,
    confidence: ai.confidence,
  });
}
