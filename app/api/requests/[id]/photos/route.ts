// app/api/requests/[id]/photos/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: Request, context: any) {
  const requestId = context?.params?.id as string | undefined;

  if (!requestId) {
    return NextResponse.json(
      { error: "Missing request id" },
      { status: 400 }
    );
  }

  const supabase = await supabaseServer();

  // Expecting JSON body like:
  // { url_thumb: string, url_work?: string, kind?: "BEFORE" | "AFTER" | "OTHER" }
  const body = (await req.json().catch(() => ({}))) as {
    url_thumb?: string;
    url_work?: string;
    kind?: string;
  };

  const { url_thumb, url_work, kind } = body;

  if (!url_thumb && !url_work) {
    return NextResponse.json(
      { error: "Missing image URLs" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("service_request_images")
    .insert({
      request_id: requestId,
      url_thumb: url_thumb ?? url_work ?? null,
      url_work: url_work ?? null,
      kind: kind ?? null,
    })
    .select("*")
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true, image: data });
}
