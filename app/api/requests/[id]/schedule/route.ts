// app/api/requests/[id]/schedule/route.ts
import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function PATCH(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = createServerSupabase();

  // Robust body parsing (ok with empty/invalid JSON)
  let body: any = null;
  try {
    const ct = _req.headers.get('content-type') || '';
    body = ct.includes('application/json') ? await _req.json() : null;
  } catch {
    body = null;
  }

  // Build update payload
  const update: Record<string, any> = { status: 'SCHEDULED' };
  if (body?.scheduled_at) update.scheduled_at = body.scheduled_at;
  if (body?.assigned_tech_id) update.assigned_tech_id = body.assigned_tech_id;

  // Update the request
  const { data, error } = await supabase
    .from('service_requests')
    .update(update)
    .eq('id', id)
    .select('id')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message ?? 'Schedule update failed' }, { status: 400 });
  }

  // Optional service_event (ignore errors)
  try {
    await supabase
      .from('service_events')
      .insert({
        request_id: id,
        event_type: 'SCHEDULED',
        notes: body?.note ?? null,
      });
  } catch {
    // intentionally ignore
  }

  return NextResponse.json({ ok: true, id: data.id });
}
