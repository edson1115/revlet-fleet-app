import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: Request) {
  let vehicleInfo = "Unknown Vehicle";
  
  try {
    const { vehicle, service } = await req.json();
    vehicleInfo = vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "Generic Vehicle";

    // 1. SETUP CLIENT
    // If no key is found, we skip straight to simulation
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (apiKey) {
        const openai = new OpenAI({ apiKey });
        
        // 2. TRY REAL AI
        console.log("🤖 Attempting OpenAI Call...");
        const prompt = `
          You are an expert automotive parts specialist.
          Vehicle: ${vehicleInfo} (Engine: ${vehicle?.engine || "Standard"}).
          Service Required: ${service}.
          
          List the standard parts required for this job. 
          Return ONLY valid JSON array. No text. 
          Format: [{"name": "Part Name", "number": "Generic Part #", "qty": 1}]
        `;

        const completion = await openai.chat.completions.create({
          messages: [{ role: "system", content: prompt }],
          model: "gpt-4o-mini", // Make sure you have access to this model, or use "gpt-3.5-turbo"
          response_format: { type: "json_object" },
        });

        const content = completion.choices[0].message.content;
        const parsed = JSON.parse(content || "{\"parts\": []}");
        const parts = parsed.parts || parsed;

        if (Array.isArray(parts) && parts.length > 0) {
            return NextResponse.json({ ok: true, source: "OPENAI", parts });
        }
    } else {
        console.log("⚠️ No API Key found. Switching to Simulation.");
    }

  } catch (e: any) {
    // 3. ERROR LOGGING
    console.error("❌ AI Service Failed:", e.message);
    // We intentionally swallow the error and proceed to the simulation below
  }

  // 4. FALLBACK SIMULATION (Guaranteed to work)
  // If we reach here, either the API key was missing, or the API call crashed.
  // We return fake data so the UI doesn't break.
  
  await new Promise(r => setTimeout(r, 1000)); // Fake delay for realism

  const mockParts = [
      { name: `Oil Filter (${vehicleInfo} OEM)`, number: "OF-9928", qty: 1 },
      { name: "Synthetic Oil (5W-30)", number: "OIL-5QT", qty: 1 },
      { name: "Drain Plug Washer", number: "DP-12", qty: 1 },
      { name: "Shop Towels", number: "SHOP-T", qty: 1 }
  ];

  return NextResponse.json({
    ok: true,
    source: "SIMULATION_FALLBACK",
    parts: mockParts
  });
}