import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";

export const runtime = "nodejs";

export async function POST(req: Request, { params }: any) {
  try {
    const scope = await resolveUserScope();
    if (!scope.uid || !scope.isCustomer) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await supabaseServer();
    const { id } = params;

    // Check vehicle belongs to customer
    const { data: v } = await supabase
      .from("vehicles")
      .select("id")
      .eq("id", id)
      .eq("customer_id", scope.customer_id)
      .maybeSingle();

    if (!v) {
      return NextResponse.json(
        { ok: false, error: "Vehicle not found or forbidden" },
        { status: 403 }
      );
    }

    const form = await req.formData();
    const photos: File[] = form.getAll("photos") as File[];

    if (!photos.length) {
      return NextResponse.json(
        { ok: false, error: "At least one photo required" },
        { status: 400 }
      );
    }

    // Convert photos to base64 for OpenAI Vision
    const images = [];
    for (const p of photos) {
      const buf = Buffer.from(await p.arrayBuffer());
      images.push({
        type: "input_image",
        image: buf.toString("base64"),
      });
    }

    // ---- RUN OPENAI VISION ----
    const prompt = `
You are an automotive service AI. Analyze all uploaded vehicle photos.
Return JSON ONLY in the following structure:
{
  "summary": "",
  "detected_issues": [],
  "maintenance_recommendations": [],
  "parts_suggestions": [],
  "next_service_miles": "",
  "confidence": ""
}
`;

    const result = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1",
        input: [
          { role: "system", content: prompt },
          ...images
        ],
        max_output_tokens: 800,
      }),
    });

    const json = await result.json();
    let parsed = null;

    try {
      parsed = JSON.parse(json.output_text);
    } catch {
      return NextResponse.json(
        { ok: false, error: "AI could not parse JSON", raw: json.output_text },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, ...parsed });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}
