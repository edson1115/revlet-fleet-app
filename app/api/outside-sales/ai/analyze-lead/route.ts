import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: Request) {
  const body = await req.json();
  const ai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const result = await ai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: `Analyze this lead:\n\n${JSON.stringify(body, null, 2)}`,
      },
    ],
  });

  return NextResponse.json({
    ok: true,
    analysis: result.choices[0].message.content,
  });
}
