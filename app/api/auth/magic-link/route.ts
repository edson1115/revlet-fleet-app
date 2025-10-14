import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const sb = createServerSupabase();
  const { email, next } = await req.json().catch(() => ({}));

  if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 });

  // Ensure you set Auth → URL configuration (SITE_URL) in Supabase
  const { error } = await sb.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: next || '/' },
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
