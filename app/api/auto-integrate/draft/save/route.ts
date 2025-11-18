// app/api/auto-integrate/draft/save/route.ts
import { supabaseServer } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const { request_id, concern, recommendations, parts, labor } = body;

  if (!request_id) {
    return NextResponse.json({ error: "Missing request_id" }, { status: 400 });
  }

  // ⭐ MUST AWAIT
  const supabase = await supabaseServer();

  const { data, error } = await supabase
    .from("auto_integrate_drafts")
    .upsert({
      request_id,
      concern: concern ?? null,
      recommendations: recommendations ?? null,
      parts: parts ?? null,
      labor: labor ?? null,
      updated_at: new Date().toISOString(),
    })
    .select()
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ draft: data });
}
