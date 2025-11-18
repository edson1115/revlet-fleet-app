// app/api/requests/[id]/photo-analysis/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Params = { id: string };
type RouteContext = { params: Promise<Params> };

export async function POST(req: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await supabaseServer();

  let payload: {
    image_url?: string;
    image_base64?: string;
  };

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { image_url, image_base64 } = payload;

  if (!image_url && !image_base64) {
    return NextResponse.json(
      { error: "Provide either image_url or image_base64" },
      { status: 400 }
    );
  }

  // --- FAKE ANALYSIS LOGIC (You can replace with real AI later) ---
  const analysis = {
    status: "ok",
    issues_detected: [],
    message: "No issues detected by placeholder analyzer",
    timestamp: new Date().toISOString(),
  };

  // Store analysis record
  const { data, error } = await supabase
    .from("request_photo_analysis")
    .insert({
      request_id: id,
      image_url: image_url ?? null,
      image_base64: image_base64 ?? null,
      analysis,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }

  return NextResponse.json(
    { message: "Analysis saved", analysis: data },
    { status: 200 }
  );
}
