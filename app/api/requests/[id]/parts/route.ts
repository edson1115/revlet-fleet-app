// app/api/requests/[id]/parts/route.ts

import { supabaseServer } from "@/lib/supabase/server";

// URL format:
// /api/requests/<id>/parts
function extractRequestId(url: string) {
  const parts = new URL(url).pathname.split("/");
  // parts: ["", "api", "requests", "<id>", "parts"]
  return parts[3];
}

export async function POST(req: Request): Promise<Response> {
  const requestId = extractRequestId(req.url);
  const supabase = await supabaseServer();

  const body = await req.json().catch(() => ({}));
  const { part_name, part_number } = body as {
    part_name?: string;
    part_number?: string;
  };

  if (!part_name) {
    return new Response(
      JSON.stringify({ error: "Missing part_name" }),
      { status: 400 }
    );
  }

  const { error } = await supabase.from("request_parts").insert({
    request_id: requestId,
    part_name,
    part_number: part_number || null,
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
    });
  }

  return new Response(
    JSON.stringify({
      success: true,
      requestId,
      part_name,
      part_number,
    }),
    { status: 200 }
  );
}
