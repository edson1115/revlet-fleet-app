// app/api/requests/[id]/start/route.ts
import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function PATCH(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = createServerSupabase();

  // Robust body parsing (works even if empty body)
  let body: any = null;
  try {
    const ct = _req.headers.get('content-type') || '';
    body = ct.includes('application/json') ? await _req.json() : null;
  } catch {
    body = null;
  }

  // Build update payload
  const update: Record<string, any> = { status: 'IN_PROGRESS' };
  // prefer client-provided timestamp if present; else now
  update.started_at = body?.started_at || new Date().toISOString();
  if (body?.assigned_tech_id) update.assigned_tech_id = body.assigned_tech_id;

  // Update the request
  const { data, error } = await supabase
    .from('service_requests')
    .update(update)
    .eq('id', id)
    .select('id')
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message ?? 'Start update failed' },
      { status: 400 },
    );
  }

  // Optional: log service_events (ignore errors)
  try {
    await supabase.from('service_events').insert({
      request_id: id,
      event_type: 'STARTED',
      notes: body?.note ?? null,
      at: update.started_at, // if your table has a timestamp column
    });
  } catch {
    // intentionally ignore
  }

  return NextResponse.json({ ok: true, id: data.id });
}
