// app/api/requests/[id]/technician/route.ts

import { supabaseServer } from "@/lib/supabase/server";

// URL looks like: /api/requests/<id>/technician
function extractRequestId(url: string) {
  const parts = new URL(url).pathname.split("/");
  // ["", "api", "requests", "<id>", "technician"]
  return parts[3];
}

export async function PATCH(req: Request): Promise<Response> {
  const supabase = await supabaseServer();
  const requestId = extractRequestId(req.url);

  const body = await req.json().catch(() => ({}));

  const {
    technician_id,
    technician_notes,
  }: {
    technician_id?: string | null;
    technician_notes?: string | null;
  } = body;

  if (!technician_id) {
    return new Response(
      JSON.stringify({ error: "Missing technician_id" }),
      { status: 400 }
    );
  }

  const updates: any = {
    technician_id,
  };

  if (technician_notes !== undefined) {
    updates.technician_notes = technician_notes;
  }

  const { error } = await supabase
    .from("requests")
    .update(updates)
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
      technician_id,
      technician_notes: technician_notes ?? null,
    }),
    { status: 200 }
  );
}
