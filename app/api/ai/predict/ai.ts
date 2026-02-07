import OpenAI from "openai";

export async function aiPredictiveModel(vehicle: any, faults: any[], health: any) {
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
  });

  const prompt = `
You are an advanced predictive maintenance AI similar to Tesla Fleet Intelligence.

INPUT:
VEHICLE:
${JSON.stringify(vehicle, null, 2)}

HEALTH:
${JSON.stringify(health, null, 2)}

FAULT LOG (last 10):
${JSON.stringify(faults.slice(0, 10), null, 2)}

TASK:
1. Predict likely component failures in the next 30 days.
2. Predict optimal maintenance schedule.
3. Identify hidden risks not obvious from data.
4. Provide a confidence score (0–1.0).
5. Output JSON ONLY.

JSON FORMAT:
{
  "predicted_failures": [...],
  "maintenance_due": [...],
  "hidden_risks": [...],
  "confidence": 0
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
      predicted_failures: [],
      maintenance_due: [],
      hidden_risks: [],
      confidence: 0.55,
    };
  }
}
