// app/api/requests/[id]/parts/[partsId]/route.ts

import { supabaseServer } from "@/lib/supabase/server";

// Example URL:
// /api/requests/<requestId>/parts/<partsId>
function extractIds(url: string) {
  const parts = new URL(url).pathname.split("/");

  // parts = ["", "api", "requests", "<id>", "parts", "<partsId>"]
  const requestId = parts[3];
  const partId = parts[5];

  return { requestId, partId };
}

export async function DELETE(req: Request): Promise<Response> {
  const supabase = await supabaseServer();
  const { requestId, partId } = extractIds(req.url);

  if (!requestId || !partId) {
    return new Response(
      JSON.stringify({ error: "Missing requestId or partId" }),
      { status: 400 }
    );
  }

  // DELETE a part from a request
  const { error } = await supabase
    .from("request_parts")
    .delete()
    .eq("id", partId)
    .eq("request_id", requestId);

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400 }
    );
  }

  return new Response(
    JSON.stringify({
      success: true,
      requestId,
      partId,
    }),
    { status: 200 }
  );
}
