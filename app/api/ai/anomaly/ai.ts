import OpenAI from "openai";

export async function aiEngine(vehicle: any, faults: any[], health: any) {
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
  });

  const prompt = `
You are an advanced automotive AI analyzing vehicle behavior.

Vehicle:
${JSON.stringify(vehicle, null, 2)}

Health:
${JSON.stringify(health, null, 2)}

Fault Log:
${JSON.stringify(faults.slice(0, 10), null, 2)}

TASK:
1. Detect unusual patterns.
2. Predict likely failures in the next 30 days.
3. Identify maintenance deviations.
4. Provide a confidence score (0–1.0).

Respond in JSON with:
{
  "ai_alerts": [...],
  "predictions": [...],
  "confidence": 0.0
}
`;

  const res = await client.responses.create({
    model: "gpt-5.1",
    input: prompt,
  });

  // FIX: Cast to any to handle potential union type mismatch with ToolCalls
let text = (res.output[0] as any).content?.[0]?.text() || "";
  try {
    return JSON.parse(text);
  } catch {
    return {
      ai_alerts: [],
      predictions: [],
      confidence: 0.55,
    };
  }
}
