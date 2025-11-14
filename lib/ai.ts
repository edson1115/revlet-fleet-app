// lib/ai.ts
import OpenAI from "openai";
import { getSystemSetting } from "@/lib/systemSettings";

/**
 * Unified AI Engine for:
 * - Portal Insights
 * - Technician Copilot
 * - Dispatch Analysis
 * - Report Summaries
 * - Predictive Maintenance
 */
export async function aiGenerate(prompt: string) {
  const apiKey = await getSystemSetting("openai_api_key");
  const model = (await getSystemSetting("ai_model")) || "gpt-4.1-mini";
  const temperature = Number(await getSystemSetting("ai_temperature") || 0.2);

  if (!apiKey) {
    return {
      error: "AI_NOT_CONFIGURED",
      output: "AI is not currently enabled for this account."
    };
  }

  const client = new OpenAI({ apiKey });

  const res = await client.chat.completions.create({
    model,
    temperature,
    messages: [
      { role: "system", content: "You are Revlet Fleet Assistant — an expert fleet AI." },
      { role: "user", content: prompt }
    ]
  });

  return { output: res.choices[0]?.message?.content || "" };
}
