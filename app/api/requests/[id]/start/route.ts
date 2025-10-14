// app/api/requests/[id]/start/route.ts
import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

type ServiceEventInput = {
  type?: string | null;  // e.g., 'NOTE' | 'PARTS' | 'STATUS' ...
  note?: string | null;  // free text
};

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = createServerSupabase();

  // Robust body parsing (works even if empty body)
  let body: { service_events?: ServiceEventInput[] } | null = null;
  try {
    const ct = req.headers.get('content-type') || '';
    body = ct.includes('application/json') ? await req.json() : null;
  } catch {
    body = null;
  }

  const nowIso = new Date().toISOString();

  // 1) Update the request → IN_PROGRESS
  const { error: updErr } = await supabase
    .from('service_requests')
    .update({ status: 'IN_PROGRESS', started_at: nowIso })
    .eq('id', id);

  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }

  // 2) Optional: record any service_events included in body
  if (body?.service_events && Array.isArray(body.service_events) && body.service_events.length > 0) {
    const rows = body.service_events.map((e) => ({
      request_id: id,
      type: e.type ?? 'STATUS',
      note: e.note ?? null,
      created_at: nowIso,
    }));

    const { error: evErr } = await supabase
      .from('service_events')
      .insert(rows, { returning: 'minimal' });

    if (evErr) {
      // We already set the request IN_PROGRESS; surface the insert error but keep 200 vs 207?
      // Using 200 + warning keeps UI flow smooth; adjust if you prefer strict failure.
      return NextResponse.json({ success: true, id, started_at: nowIso, warning: evErr.message });
    }
  }

  return NextResponse.json({ success: true, id, started_at: nowIso });
}
