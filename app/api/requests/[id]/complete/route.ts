import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// PATCH /api/requests/:id/complete
export async function PATCH(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }    // ← params is a Promise now
) {
  const { id } = await ctx.params;            // ← await it
  const nowIso = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from("service_requests")
    .update({ status: "COMPLETED", completed_at: nowIso })
    .eq("id", id)
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // best-effort event log (ignore failure)
  await supabaseAdmin.from("service_events").insert([
    { request_id: id, event_type: "COMPLETED" },
  ]);

  return NextResponse.json({ ok: true, id: data.id });
}
