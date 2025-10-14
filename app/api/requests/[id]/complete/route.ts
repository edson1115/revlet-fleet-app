// app/api/requests/[id]/complete/route.ts
import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

type Body = {
  odometer_miles?: number | null;
  service_events?: { type?: string | null; note?: string | null }[];
  recommendations?: Record<string, any> | null;
};

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = createServerSupabase();

  let body: Body | null = null;
  try {
    const ct = req.headers.get('content-type') || '';
    body = ct.includes('application/json') ? await req.json() : null;
  } catch { body = null; }

  const nowIso = new Date().toISOString();

  const { error: updErr } = await supabase
    .from('service_requests')
    .update({
      status: 'COMPLETED',
      completed_at: nowIso,
      odometer_miles: body?.odometer_miles ?? null,
    })
    .eq('id', id);

  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

  // Optional: log recommendations as a service_event (JSON in note)
  if (body?.recommendations) {
    const { error: recErr } = await supabase.from('service_events').insert([
      {
        request_id: id,
        type: 'RECOMMENDATION',
        note: JSON.stringify(body.recommendations),
        created_at: nowIso,
      },
    ]);
    if (recErr) return NextResponse.json({ success: true, id, warning: recErr.message });
  }

  // Optional: insert any other service_events the client provided
  if (body?.service_events?.length) {
    const rows = body.service_events.map((e) => ({
      request_id: id,
      type: e.type ?? 'STATUS',
      note: e.note ?? null,
      created_at: nowIso,
    }));
    const { error: evErr } = await supabase.from('service_events').insert(rows, { returning: 'minimal' });
    if (evErr) return NextResponse.json({ success: true, id, warning: evErr.message });
  }

  return NextResponse.json({ success: true, id, completed_at: nowIso });
}
