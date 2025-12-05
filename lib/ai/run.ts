// lib/ai/run.ts

import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/**
 * Robust runner for AI responses.
 * Handles all OpenAI output formats safely.
 */
export async function runAI(prompt: string): Promise<string> {
  const resp = await client.responses.create({
    model: "gpt-4o-mini",
    input: prompt,
  });

  // ---- Safe extraction of output ----
  let output: string | null = null;

  // Case 1: output_text is present (most common)
  if (resp.output_text) {
    output = resp.output_text.trim();
  }

  // Case 2: Response has an output array with content blocks
  if (!output && Array.isArray(resp.output) && resp.output.length > 0) {
    const first = resp.output[0];

    // Newer OpenAI format: content array exists
    if (first && "content" in first && Array.isArray((first as any).content)) {
      const contentArr = (first as any).content;
      if (contentArr[0]?.text) {
        output = contentArr[0].text.trim();
      }
    }

    // Some responses use `.text` directly
    if (!output && (first as any).text) {
      output = String((first as any).text).trim();
    }

    // Fallback: stringify object
    if (!output) {
      output = JSON.stringify(first);
    }
  }

  // Case 3: Fallback hard
  if (!output) {
    output = "No response generated.";
  }

  return output;
}



