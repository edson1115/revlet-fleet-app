import { NextResponse } from "next/server";
import { OpenAI } from "openai";

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { image, prompt } = body;

    if (!image) {
      return NextResponse.json({ ok: false, error: "Image URL is required" }, { status: 400 });
    }

    // FIX: Use 'messages' instead of 'input', and 'image_url' instead of 'input_image'
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: prompt || "Analyze the damage in this image and estimate severity." 
            },
            {
              type: "image_url",
              image_url: {
                url: image,
              },
            },
          ],
        },
      ],
      max_tokens: 500,
    });

    const analysis = response.choices[0].message.content;

    return NextResponse.json({ ok: true, analysis });

  } catch (err: any) {
    console.error("AI Damage Analysis Error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}