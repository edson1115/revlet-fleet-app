import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { vehicle } = await req.json();

    const systemPrompt = `
You are Revlet AI — an advanced automotive diagnostic assistant.
Analyze vehicle details, service history, notes, and images (if any). 
Return:
1. Clean summary
2. Mechanical diagnosis
3. Recommended actions (list)
4. Extracted PO number if present
Be concise, accurate, and professional.
    `;

    const userPrompt = `
VEHICLE:
${JSON.stringify(vehicle, null, 2)}

Analyze everything.
    `;

    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    const data = await aiRes.json();

    const txt = data.choices?.[0]?.message?.content || "";

    // Simple parser (structured output)
    const analysis = {
      summary: txt.match(/Summary:(.*?)(Diagnosis:|$)/s)?.[1]?.trim(),
      diagnosis: txt.match(/Diagnosis:(.*?)(Recommendations:|$)/s)?.[1]?.trim(),
      recommendations:
        txt
          .match(/Recommendations:(.*)/s)?.[1]
          ?.split("\n")
          ?.map((x: string) => x.trim())
          ?.filter((x: string) => x.length > 0) || [],
      po_number:
        txt.match(/PO[:#]?\s*(\w+)/i)?.[1] || null,
    };

    return NextResponse.json({ ok: true, analysis });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}
