import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import OpenAI from "openai";

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    // 1. SECURITY: Initialize Supabase to check the user
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() { return cookieStore.getAll() },
            setAll(cookiesToSet) {
              try {
                cookiesToSet.forEach(({ name, value, options }) =>
                  cookieStore.set(name, value, options)
                );
              } catch { }
            },
          },
        }
      );

    // 2. AUTH CHECK: Kick them out if not logged in
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 3. GET DATA
    const { vehicle } = await req.json();

    // 4. DEFINE PROMPTS (Force JSON Output)
    const systemPrompt = `
    You are Revlet AI — an advanced automotive diagnostic assistant.
    Analyze the provided vehicle details.
    
    IMPORTANT: You must return a valid JSON object with exactly these keys:
    {
      "summary": "A 2 sentence overview of the vehicle status",
      "diagnosis": "Technical assessment of condition",
      "recommendations": ["Action item 1", "Action item 2", "Action item 3"],
      "po_number": "Extracted PO number or null"
    }
    Do not include markdown formatting (like \`\`\`json). Just the raw JSON.
    `;

    // 5. CALL OPENAI (Using GPT-4o)
    const completion = await openai.chat.completions.create({
        model: "gpt-4o", // ✅ Use the correct latest model
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `VEHICLE DATA: ${JSON.stringify(vehicle)}` },
        ],
        response_format: { type: "json_object" }, // ✅ Guarantees valid JSON
    });

    // 6. PARSE & RETURN
    const content = completion.choices[0].message.content;
    
    if (!content) {
        throw new Error("No analysis returned from AI");
    }

    const analysis = JSON.parse(content);

    return NextResponse.json({ ok: true, analysis });

  } catch (err: any) {
    console.error("AI Brain Error:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}