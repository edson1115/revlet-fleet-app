// app/api/auto-integrate/draft/load/route.ts
import { supabaseServer } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const request_id = url.searchParams.get("request_id");
  if (!request_id) {
    return NextResponse.json({ error: "Missing request_id" }, { status: 400 });
  }

  // ⭐ MUST AWAIT
  const supabase = await supabaseServer();

  const { data, error } = await supabase
    .from("auto_integrate_drafts")
    .select("*")
    .eq("request_id", request_id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ draft: data });
}
