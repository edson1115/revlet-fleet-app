import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import OpenAI from "openai";

export async function GET() {
  try {
    const supabase = await supabaseServer();

    // AUTH
    const { data: { user } } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // GET CUSTOMER
    const { data: profile } = await supabase
      .from("profiles")
      .select("customer_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.customer_id)
      return NextResponse.json({ error: "Not a customer" }, { status: 403 });

    // GET VEHICLES
    const { data: vehicles, error } = await supabase
      .from("vehicles")
      .select("*")
      .eq("customer_id", profile.customer_id);

    if (error)
      return NextResponse.json({ error: error.message }, { status: 400 });

    // GROUP COUNTS
    const groupCounts: Record<string, number> = {};
    const yearCounts: Record<string, number> = {};
    const modelCounts: Record<string, number> = {};

    vehicles.forEach((v) => {
      const g = v.group_name || "Ungrouped";
      groupCounts[g] = (groupCounts[g] || 0) + 1;

      const y = v.year || "Unknown";
      yearCounts[y] = (yearCounts[y] || 0) + 1;

      const m = `${v.make} ${v.model}`;
      modelCounts[m] = (modelCounts[m] || 0) + 1;
    });

    // AI SMART INSIGHTS
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });

    const prompt = `
Analyze this fleet and produce short, actionable insights.

GROUP COUNTS:
${JSON.stringify(groupCounts, null, 2)}

YEAR COUNTS:
${JSON.stringify(yearCounts, null, 2)}

MODEL COUNTS:
${JSON.stringify(modelCounts, null, 2)}

Give:
- Fleet Uniformity Score (0–100)
- Risks
- Efficiency opportunities
- Any recommended fleet standardization
- Always be concise
    `;

    const ai = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
    });

    const insights = ai.output_text || "No insights available.";

    return NextResponse.json({
      ok: true,
      vehicles,
      groupCounts,
      yearCounts,
      modelCounts,
      insights,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 },
    );
  }
}
