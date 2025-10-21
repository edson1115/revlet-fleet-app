import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const sb = supabaseServer();

  let body: any = null;
  try {
    const ct = req.headers.get('content-type') || '';
    body = ct.includes('application/json') ? await req.json() : null;
  } catch { /* noop */ }

  if (!body?.email) return NextResponse.json({ error: 'email required' }, { status: 400 });

  const { data, error } = await sb.from('access_requests').insert({
    email: body.email,
    name: body.name ?? null,
    company_name: body.company_name ?? null,
    requested_role: body.requested_role ?? 'CUSTOMER',
    note: body.note ?? null,
  }).select('id').single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ id: data?.id }, { status: 201 });
}
