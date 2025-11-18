// app/api/requests/[id]/po/route.ts

import { supabaseServer } from "@/lib/supabase/server";

// Extract ID from URL: /api/requests/<id>/po
function extractRequestId(url: string) {
  const parts = new URL(url).pathname.split("/");
  return parts[3]; // "requests" = 2, "<id>" = 3
}

export async function PATCH(req: Request): Promise<Response> {
  const supabase = await supabaseServer();
  const requestId = extractRequestId(req.url);

  const body = await req.json().catch(() => ({}));
  const { po_number, po_notes } = body as {
    po_number?: string | null;
    po_notes?: string | null;
  };

  if (!po_number) {
    return new Response(
      JSON.stringify({ error: "Missing po_number" }),
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("requests")
    .update({
      po_number,
      po_notes: po_notes ?? null,
    })
    .eq("id", requestId);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
    });
  }

  return new Response(
    JSON.stringify({
      success: true,
      requestId,
      po_number,
      po_notes: po_notes ?? null,
    }),
    { status: 200 }
  );
}
