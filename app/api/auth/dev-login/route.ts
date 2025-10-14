import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  const url = new URL(req.url);
  const email = url.searchParams.get('email');
  const next = url.searchParams.get('next') || '/';
  if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 });

  const supabaseUrl = process.env.SUPABASE_URL!;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  const { data, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { emailRedirectTo: `${url.origin}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const link = (data as any)?.properties?.action_link as string | undefined;
  if (!link) return NextResponse.json({ error: 'no action_link returned' }, { status: 500 });

  return NextResponse.redirect(link);
}
