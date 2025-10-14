// app/api/auth/link-user/route.ts
import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const { email } = await req.json().catch(() => ({}));
  if (!email) return NextResponse.json({ error: 'missing email' }, { status: 400 });

  const supabase = await createServerSupabase();

  // Example: ensure there is a row for this email in app_users
  const { error } = await supabase
    .from('app_users')
    .upsert({ email }, { onConflict: 'email' });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
