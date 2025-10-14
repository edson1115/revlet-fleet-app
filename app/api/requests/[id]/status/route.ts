// app/api/requests/[id]/status/route.ts
import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = createServerSupabase();

  let body: any = null;
  try {
    const ct = req.headers.get('content-type') || '';
    body = ct.includes('application/json') ? await req.json() : null;
  } catch { body = null; }

  const update = {
    status: body?.status ?? null,
    po_number: body?.po_number ?? null,
  };

  const { error } = await supabase.from('service_requests').update(update).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Optional: log service_events here if you have that table
  return NextResponse.json({ success: true, id });
}
