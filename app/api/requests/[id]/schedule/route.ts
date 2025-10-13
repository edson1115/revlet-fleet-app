// app/api/requests/[id]/schedule/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;

  const body = await req.json().catch(() => ({} as any));

  // Build update payload
  const update: Record<string, any> = { status: "SCHEDULED" };
  if (body?.scheduled_at) update.scheduled_at = body.scheduled_at;
  if (body?.assigned_tech_id) update.assigned_tech_id = body.assigned_tech_id;

  // Update the request
  const { data, error } = await supabaseAdmin
    .from("service_requests")
    .update(update)
    .eq("id", id)
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Optional: write a service_event; ignore any errors
  try {
    const { error: eventErr } = await supabaseAdmin
      .from("service_events")
      .insert([
        { request_id: id, event_type: "SCHEDULED", notes: body?.note ?? null },
      ])
      .select("id")
      .single();
    // Ignore eventErr on purpose
  } catch {
    // swallow
  }

  return NextResponse.json({ ok: true, id: data.id });
}
