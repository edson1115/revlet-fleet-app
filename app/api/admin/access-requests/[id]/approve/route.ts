import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

type Role = 'CUSTOMER'|'OFFICE'|'DISPATCH'|'TECH'|'ADMIN'|'FLEET_MANAGER';

export async function GET() {
  const sb = createServerSupabase();
  const { data, error } = await sb
    .from('access_requests')
    .select('id, email, name, requested_role, created_at')
    .eq('status','PENDING')
    .order('created_at',{ascending:false});
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ rows: data ?? [] });
}

export async function PATCH(req: Request) {
  const sb = createServerSupabase();
  const body = await req.json().catch(() => ({}));
  const { id, role, customer_id, invite } = body as {
    id: string; role: Role; customer_id?: string|null; invite?: boolean;
  };

  if (!id || !role) return NextResponse.json({ error: 'id and role are required' }, { status: 400 });
  if (role === 'CUSTOMER' && !customer_id)
    return NextResponse.json({ error: 'customer_id required for CUSTOMER' }, { status: 400 });

  // 1) Mark request approved
  const { data: reqRow, error: reqErr } = await sb
    .from('access_requests')
    .update({ status: 'APPROVED', approved_at: new Date().toISOString() })
    .eq('id', id)
    .select('email, name')
    .single();
  if (reqErr) return NextResponse.json({ error: reqErr.message }, { status: 400 });

  // 2) Upsert into app_users directory
  const { error: upErr } = await sb
    .from('app_users')
    .upsert({
      email: reqRow.email,
      name: reqRow.name ?? null,
      role,
      customer_id: customer_id ?? null,
      // company_id will be applied by your server helper in RLS queries; if you need explicit, add it here.
    }, { onConflict: 'email' });
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 400 });

  // 3) Optional: send magic link right away
  if (invite) {
    const { error: authErr } = await sb.auth.signInWithOtp({
      email: reqRow.email,
      options: { emailRedirectTo: '/'} // could pass a role-specific landing
    });
    if (authErr) return NextResponse.json({ error: `Approved, invite failed: ${authErr.message}` }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
