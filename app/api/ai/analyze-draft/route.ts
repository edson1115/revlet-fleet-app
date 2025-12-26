import { NextResponse } from "next/server";

export const runtime = "edge"; // Optional: Use edge for speed if on Vercel

export async function POST(req: Request) {
  try {
    const { notes } = await req.json();

    if (!notes) {
      return NextResponse.json({ ok: false, error: "No notes provided" }, { status: 400 });
    }

    // ------------------------------------------------------------------
    // 🧠 SIMPLE RULE-BASED AI (Replace with OpenAI call for V2)
    // ------------------------------------------------------------------
    // This logic runs on the server, keeping your client bundle light.
    
    let title = "General Diagnosis";
    let priority = "NORMAL";
    const lower = notes.toLowerCase();

    if (lower.includes("oil") || lower.includes("filter")) title = "Oil Change";
    else if (lower.includes("tire") || lower.includes("flat")) title = "Tire Service";
    else if (lower.includes("brake") || lower.includes("squeak")) title = "Brake Service";
    else if (lower.includes("battery") || lower.includes("start")) title = "Battery Service";
    else if (lower.includes("ac") || lower.includes("hot") || lower.includes("air")) title = "A/C Inspection";
    else if (lower.includes("glass") || lower.includes("windshield")) title = "Glass Repair";

    if (lower.includes("smoke") || lower.includes("fire") || lower.includes("leak") || lower.includes("asap")) {
        priority = "URGENT";
    }

    // Simulate "thinking" time for effect
    await new Promise(r => setTimeout(r, 800));

    return NextResponse.json({ 
        ok: true, 
        prediction: { title, priority } 
    });

  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}