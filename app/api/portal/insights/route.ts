// app/api/portal/insights/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Stub AI runner — replace with your real implementation
async function runAI(prompt: string) {
  // If you have OpenAI / custom AI, plug it in here.
  return { result: [`Insight for: ${prompt}`], error: null };
}

export async function POST(req: Request) {
  try {
    const supabase = await supabaseServer();

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json([], { status: 200 });
    }

    const { prompt } = await req.json();
    if (!prompt) return NextResponse.json([], { status: 200 });

    const aiResponse = await runAI(prompt);

    // ❗ FIX: This was "ai.error" but "ai" does not exist.
    if (aiResponse.error) {
      return NextResponse.json([]);
    }

    let out: any[] = [];

    try {
      if (Array.isArray(aiResponse.result)) {
        out = aiResponse.result;
      } else if (aiResponse.result) {
        out = [aiResponse.result];
      }
    } catch {
      out = [];
    }

    return NextResponse.json(out);
  } catch (err) {
    console.error("Insight error", err);
    return NextResponse.json([]);
  }
}



