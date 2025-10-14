import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

type Role = 'CUSTOMER'|'OFFICE'|'DISPATCH'|'TECH'|'ADMIN'|'FLEET_MANAGER';

export async function GET() {
  const sb = createServerSupabase();
  const { data, error } = await sb
    .from('app_users')
    .select('id, email, name, role, customer_id')
    .order('email');
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ rows: data ?? [] });
}

export async function PATCH(req: Request) {
  const sb = createServerSupabase();
  const body = await req.json().catch(() => ({}));
  const { id, role, customer_id } = body as { id: string; role: Role; customer_id?: string|null };
  if (!id || !role) return NextResponse.json({ error: 'id and role are required' }, { status: 400 });
  if (role === 'CUSTOMER' && !customer_id)
    return NextResponse.json({ error: 'customer_id required for CUSTOMER' }, { status: 400 });

  const { error } = await sb
    .from('app_users')
    .update({ role, customer_id: customer_id ?? null })
    .eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
