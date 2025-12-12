// app/api/ai/vehicles/group/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import OpenAI from "openai";

// ----------------------------------------
// Init AI
// ----------------------------------------
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// ----------------------------------------
// RULE ENGINE (fast path)
// ----------------------------------------
function ruleEngine(v: any) {
  const make = (v.make || "").toLowerCase();
  const model = (v.model || "").toLowerCase();

  if (make.includes("ford") && model.includes("transit")) return "Ford Transit";
  if (make.includes("ram") && model.includes("promaster")) return "Ram Promaster";
  if (make.includes("mercedes") && model.includes("sprinter")) return "Sprinter";
  if (make.includes("toyota")) return `Toyota ${v.model}`;

  if (model.includes("van")) return "Cargo Vans";
  if (model.includes("truck")) return "Trucks";

  return null; // fallback to clustering or AI
}

// ----------------------------------------
// CLUSTER ENGINE (groups by make+model fingerprint)
// ----------------------------------------
function clusterEngine(vehicles: any[]) {
  const clusters: Record<string, any[]> = {};

  vehicles.forEach((v) => {
    const key =
      `${v.make || ""}-${v.model || ""}-${v.year || ""}`
        .trim()
        .toLowerCase();

    if (!clusters[key]) clusters[key] = [];
    clusters[key].push(v);
  });

  // Convert to group suggestions
  const suggestions = Object.values(clusters).map((group) => {
    const sample = group[0];
    return {
      name: `${sample.make} ${sample.model}`.trim(),
      vehicles: group,
    };
  });

  return suggestions;
}

// ----------------------------------------
// AI ENGINE (only if needed)
// ----------------------------------------
async function aiSuggestGroup(vehicle: any) {
  const prompt = `
You are grouping fleet vehicles into organizational buckets.
Given:
Make: ${vehicle.make}
Model: ${vehicle.model}
Year: ${vehicle.year}

Return ONLY the group name. Example:
"Ford Transit"
"Ram Promaster"
"Sprinter"
"Compact Cars"
`;

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 20,
    });

    return completion.choices[0].message.content?.trim() || null;
  } catch (err) {
    console.error("AI group error:", err);
    return null;
  }
}

// ----------------------------------------
// MAIN API ENTRY
// ----------------------------------------
export async function POST(req: Request) {
  try {
    const supabase = await supabaseServer();

    const body = await req.json();
    const vehicles = body.vehicles || [];
    if (!Array.isArray(vehicles) || vehicles.length === 0) {
      return NextResponse.json({ error: "No vehicles supplied" }, { status: 400 });
    }

    const results: Record<string, string | null> = {};

    // 1️⃣ Rule Engine
    for (const v of vehicles) {
      const rule = ruleEngine(v);
      if (rule) {
        results[v.id] = rule;
      } else {
        results[v.id] = null; // unresolved
      }
    }

    // 2️⃣ Cluster Engine (fallback)
    const unresolved = vehicles.filter((v) => !results[v.id]);
    let clusterRes: any[] = [];

    if (unresolved.length > 0) {
      clusterRes = clusterEngine(unresolved);
      // Assign cluster names
      clusterRes.forEach((grp) => {
        grp.vehicles.forEach((v: any) => {
          if (!results[v.id]) {
            results[v.id] = grp.name;
          }
        });
      });
    }

    // 3️⃣ AI Suggestions (final fallback)
    for (const v of vehicles) {
      if (!results[v.id]) {
        const ai = await aiSuggestGroup(v);
        results[v.id] = ai || "Other";
      }
    }

    return NextResponse.json({ ok: true, groups: results });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Server error", detail: err.message },
      { status: 500 }
    );
  }
}
