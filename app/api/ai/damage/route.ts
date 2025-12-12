import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const { image_url } = await req.json();

    const prompt = `
You are an automotive damage inspector. Analyze the vehicle image and return JSON ONLY with:

- damage_detected: yes/no
- items: array of { part, issue, severity }
- summary: short sentence
- risk_level: low/medium/high
- technician_notes: short notes for repair tech
    `;

    const result = await client.responses.create({
      model: "gpt-4o-mini",
      input: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "input_image", image_url },
          ],
        },
      ],
    });

    const json = JSON.parse(result.output_text);

    return NextResponse.json({ ok: true, analysis: json });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ ok: false, error: err.message });
  }
}
