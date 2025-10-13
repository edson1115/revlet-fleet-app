// app/api/requests/[id]/complete/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PATCH(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  let body: any = null;

  try {
    const ct = _req.headers.get('content-type') || '';
    body = ct.includes('application/json') ? await _req.json() : null;
  } catch { /* ignore */ }

  const update: Record<string, any> = {
    status: 'COMPLETED',
    completed_at: new Date().toISOString(),
  };
  if (typeof body?.odometer_miles !== 'undefined') {
    update.odometer_miles = body.odometer_miles === '' ? null : Number(body.odometer_miles);
  }

  const { data, error } = await supabaseAdmin
    .from('service_requests')
    .update(update)
    .eq('id', id)
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Optional: service_events
  if (body?.note) {
    const { error: e2 } = await supabaseAdmin
      .from('service_events')
      .insert([{ request_id: id, event_type: 'COMPLETED', notes: body.note }]);
    if (e2) {
      // Don’t fail the main op, just include info
      return NextResponse.json({ id: data.id, warning: 'Completed, event not recorded' });
    }
  }

  return NextResponse.json({ id: data.id });
}
