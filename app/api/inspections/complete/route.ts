import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { generateServiceSummary } from "@/lib/intelligence";

export async function POST(request: Request) {
  try {
    const { requestId, techNotes, partsUsed, inspectionFlags } = await request.json();
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    // 1. Generate the Smart Summary
    const aiOutput = generateServiceSummary(techNotes, partsUsed, inspectionFlags);

    // 2. Save to inspection_ai_outputs (The Trust Layer)
    const { error: aiError } = await supabase.from("inspection_ai_outputs").insert({
      request_id: requestId,
      summary_text: aiOutput.summary_text,
      classification_json: { flags: inspectionFlags },
      confidence_score: 95
    });

    if (aiError) throw aiError;

    // 3. Log the Compliance Trail event
    await supabase.from("fleet_events").insert({
      entity_type: "request",
      entity_id: requestId,
      event_type: "INSPECTION_AUTO_DOCUMENTED",
      event_payload: { summary: aiOutput.summary_text }
    });

    return NextResponse.json({ success: true, summary: aiOutput.summary_text });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}