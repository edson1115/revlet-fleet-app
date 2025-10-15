// lib/auth/requireRole.ts
import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase/server';

export function json(body: any, status = 200) {
  return new NextResponse(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export function onError(e: any) {
  console.error(e);
  return json({ error: e?.message ?? 'Internal error' }, 500);
}

type Role = 'ADMIN' | 'OFFICE' | 'DISPATCH' | 'TECH' | 'CUSTOMER';

export async function requireRole(roles: Role[]) {
  const supabase = await getSupabase();
  const { data: auth } = await supabase.auth.getUser();
  const authId = auth?.user?.id ?? null;

  if (!authId) {
    throw new Error('unauthorized');
  }

  const { data: me, error } = await supabase
    .from('users')
    .select('auth_user_id, role, company_id')
    .eq('auth_user_id', authId)
    .maybeSingle();

  if (error || !me) {
    throw new Error('forbidden');
  }
  if (!roles.includes(me.role as Role)) {
    throw new Error('forbidden');
  }

  return {
    role: me.role as Role,
    company_id: me.company_id as string,
    auth_user_id: me.auth_user_id as string,
  };
}

export { getSupabase }; // re-export for convenience
