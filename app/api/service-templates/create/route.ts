// app/api/service-templates/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  // NEW: supabaseServer() must be awaited under Supabase SSR v2
  const supabase = await supabaseServer();

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { name, description, lines } = body as {
    name: string;
    description?: string | null;
    lines?: Array<{
      line_type?: string | null;
      description?: string | null;
      quantity?: number | null;
      hours?: number | null;
      part_number?: string | null;
    }>;
  };

  if (!name) {
    return NextResponse.json({ error: "Template name is required" }, { status: 400 });
  }

  // Create base template row
  const { data: template, error: insertErr } = await supabase
    .from("service_templates")
    .insert({
      name,
      description: description ?? null,
    })
    .select()
    .single();

  if (insertErr || !template) {
    return NextResponse.json(
      { error: insertErr?.message || "Failed to create service template" },
      { status: 400 }
    );
  }

  // Insert template line items (optional)
  if (Array.isArray(lines) && lines.length > 0) {
    const lineRows = lines.map((line) => ({
      template_id: template.id,
      line_type: line.line_type ?? null,
      description: line.description ?? null,
      quantity: line.quantity ?? null,
      hours: line.hours ?? null,
      part_number: line.part_number ?? null,
    }));

    const { error: lineErr } = await supabase
      .from("service_template_lines")
      .insert(lineRows);

    if (lineErr) {
      return NextResponse.json(
        { error: lineErr.message || "Failed to insert template lines" },
        { status: 400 }
      );
    }
  }

  return NextResponse.json({ template }, { status: 200 });
}
