import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { aiGenerate } from "@/lib/ai";

export async function GET() {
  const supabase = await supabaseServer();

  const { data: auth } = await supabase.auth.getUser();
  const uid = auth?.user?.id;
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: prof } = await supabase
    .from("profiles")
    .select("customer_id")
    .eq("id", uid)
    .maybeSingle();

  const customer_id = prof?.customer_id;
  if (!customer_id) return NextResponse.json([]);

  // Get service history
  const { data: history } = await supabase
    .from("service_requests")
    .select("service, notes, created_at, status")
    .eq("customer_id", customer_id)
    .order("created_at", { ascending: false })
    .limit(200);

  const prompt = `
You are Revlet Fleet AI Analyst.
Analyze this customer's service history.
Produce:
- 3 insights max
- each with "title", "body", "tags"
Service History:
${JSON.stringify(history, null, 2)}
`;

  const ai = await aiGenerate(prompt);

  if (ai.error) return NextResponse.json([]);

  let out = [];
  try {
    out = JSON.parse(ai.output);
  } catch {
    out = [{ title: "Insight", body: ai.output, tags: [] }];
  }

  return NextResponse.json(out);
}
