import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { make, model, year, plate, unit_number } = body;

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });

    const prompt = `
You are Revlet’s Vehicle Grouping AI.
Given vehicle info, output ONLY a short, clean group label.

Examples:
- Ford Transit 250 for Amazon → "Amazon Vans"
- Ford Transit 350 Enterprise → "Enterprise Vans"
- Ram ProMaster 2500 Hertz → "Hertz Cargo Vans"
- Toyota Prius Uber → "Rideshare Hybrids"

Return ONLY the group label. No sentences.

Vehicle:
Make: ${make}
Model: ${model}
Year: ${year}
Plate: ${plate}
Unit: ${unit_number}
    `;

    const completion = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
    });

    const group = completion.output_text
      ?.trim()
      ?.replace(/["']/g, "")
      || "General Fleet";

    return NextResponse.json({ ok: true, group });
  } catch (err: any) {
    console.error("AI GROUP ERROR:", err);
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}
