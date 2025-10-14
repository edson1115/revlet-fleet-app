// DEV ONLY: generate a magic-link URL you can click without SMTP.
// Guarded by NODE_ENV and a simple secret query param.
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }
  const url = new URL(req.url);
  const email = url.searchParams.get('email') || '';
  const next = url.searchParams.get('next') || '/';
  const secret = url.searchParams.get('secret');

  if (!secret || secret !== process.env.DEV_MAGIC_SECRET) {
    return NextResponse.json({ error: 'Missing/invalid secret' }, { status: 401 });
  }
  if (!email) {
    return NextResponse.json({ error: 'email is required' }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey  = process.env.SUPABASE_SERVICE_KEY!;
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  const { data, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { emailRedirectTo: next },
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const link = (data as any)?.properties?.action_link as string | undefined;
  if (!link) return NextResponse.json({ error: 'No action_link returned' }, { status: 500 });

  // For convenience, redirect straight to the link:
  return NextResponse.redirect(link);
}
