// app/api/requests/[id]/eta/route.ts

import { supabaseServer } from "@/lib/supabase/server";

// Extract request ID from: /api/requests/[id]/eta
function extractRequestId(url: string) {
  const parts = new URL(url).pathname.split("/");
  return parts[parts.length - 2]; 
}

export async function PATCH(req: Request): Promise<Response> {
  const supabase = await supabaseServer();
  const requestId = extractRequestId(req.url);

  // Parse ETA update body
  const body = await req.json().catch(() => ({}));
  const { eta, reason } = body as {
    eta?: string | null;
    reason?: string | null;
  };

  if (!eta) {
    return new Response(
      JSON.stringify({ error: "Missing ETA value" }),
      { status: 400 }
    );
  }

  // Update request ETA
  const { error } = await supabase
    .from("requests")
    .update({
      eta,
      eta_reason: reason ?? null,
    })
    .eq("id", requestId);

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400 }
    );
  }

  return new Response(
    JSON.stringify({
      success: true,
      id: requestId,
      eta,
      reason: reason ?? null,
    }),
    { status: 200 }
  );
}
