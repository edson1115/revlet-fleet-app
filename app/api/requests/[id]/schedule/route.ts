// app/api/requests/[id]/schedule/route.ts

import { supabaseServer } from "@/lib/supabase/server";

// URL: /api/requests/<id>/schedule
function extractRequestId(url: string) {
  const parts = new URL(url).pathname.split("/");
  // ["", "api", "requests", "<id>", "schedule"]
  return parts[3];
}

export async function PATCH(req: Request): Promise<Response> {
  const supabase = await supabaseServer();
  const requestId = extractRequestId(req.url);

  const body = await req.json().catch(() => ({}));

  const {
    scheduled_at,
    technician_id,
    notes,
  }: {
    scheduled_at?: string | null;
    technician_id?: string | null;
    notes?: string | null;
  } = body;

  if (!scheduled_at) {
    return new Response(
      JSON.stringify({ error: "Missing scheduled_at" }),
      { status: 400 }
    );
  }

  const updates: any = {
    scheduled_at,
  };

  if (technician_id !== undefined) {
    updates.technician_id = technician_id;
  }
  if (notes !== undefined) {
    updates.dispatch_notes = notes;
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
      scheduled_at,
      technician_id: technician_id ?? null,
      notes: notes ?? null,
    }),
    { status: 200 }
  );
}
