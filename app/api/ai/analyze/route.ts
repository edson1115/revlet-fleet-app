import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { notes, image_url } = await req.json();

    // ---------------------------------------------------------
    // MOCK AI LOGIC (Replace with real OpenAI/Gemini call later)
    // ---------------------------------------------------------
    // This allows the button to "work" immediately for the demo.
    
    await new Promise((resolve) => setTimeout(resolve, 1500)); // Fake delay

    let suggestion = {
      title: "General Diagnosis",
      description: `Customer reported issue: "${notes}". Tech inspection required.`,
    };

    const lower = notes.toLowerCase();
    if (lower.includes("tire") || lower.includes("flat")) {
      suggestion.title = "Tire Service";
      suggestion.description = "Customer reported tire issue. Check for punctures, tread depth, and pressure.";
    } else if (lower.includes("oil") || lower.includes("service")) {
      suggestion.title = "Oil Change & Service";
      suggestion.description = "Standard maintenance requested. Check oil levels and filters.";
    } else if (lower.includes("brake") || lower.includes("noise")) {
      suggestion.title = "Brake Inspection";
      suggestion.description = "Customer reported noise/braking issue. Inspect pads and rotors.";
    } else if (lower.includes("battery") || lower.includes("start")) {
        suggestion.title = "Battery & Charging System";
        suggestion.description = "Check battery health and alternator output.";
    }

    return NextResponse.json({ ok: true, result: suggestion });

  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}