// app/api/tech/copilot/route.ts
export const dynamic = "force-dynamic";
export const runtime = "edge";

import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: Request) {
  // Prevent OpenAI from running during build
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return NextResponse.json(
      { message: "Build-time skip" },
      { status: 200 }
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing OPENAI_API_KEY" },
      { status: 500 }
    );
  }

  const openai = new OpenAI({ apiKey });

  const { prompt } = await req.json();
  if (!prompt) {
    return NextResponse.json(
      { error: "Missing prompt" },
      { status: 400 }
    );
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "user", content: prompt }
    ]
  });

  return NextResponse.json(
    {
      output: completion.choices[0].message.content
    },
    { status: 200 }
  );
}
