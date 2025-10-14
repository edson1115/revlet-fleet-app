// app/api/requests/[id]/assign/route.ts
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

  const { error } = await supabase
    .from('service_requests')
    .update({
      assigned_tech_id: body?.assigned_tech_id ?? null,
      dispatch_notes: body?.dispatch_notes ?? null,
      scheduled_at: body?.scheduled_at ?? null,
      status: 'SCHEDULED',
    })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, id });
}
