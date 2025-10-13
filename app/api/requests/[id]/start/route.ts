import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * PATCH /api/requests/:id/start
 * Body (optional): { note?: string, assigned_tech_id?: string }
 * Effect: status = IN_PROGRESS, started_at = now (UTC), optional assigned_tech_id
 */
export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({} as any));

  const update: Record<string, any> = {
    status: 'IN_PROGRESS',
    started_at: new Date().toISOString(),
  };
  if (body?.assigned_tech_id) update.assigned_tech_id = body.assigned_tech_id;

  const { data, error } = await supabaseAdmin
    .from('service_requests')
    .update(update)
    .eq('id', id)
    .select('id')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Optional event log (don’t break if it fails)
  if (body?.note) {
    try {
      await supabaseAdmin
        .from('service_events')
        .insert([{ request_id: id, event_type: 'STARTED', notes: body.note }])
        .select('id')
        .single();
    } catch {}
  }

  return NextResponse.json({ ok: true, id: data!.id });
}
