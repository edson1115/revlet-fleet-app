// app/api/auth/magic/route.ts
import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const { access_token, refresh_token, next } = await req.json().catch(() => ({}))

  if (!access_token || !refresh_token) {
    return NextResponse.json({ error: 'missing tokens' }, { status: 400 })
  }

  const supabase = await createServerSupabase()

  const { error } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  })
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  const url = new URL(next || '/', new URL(req.url).origin)
  return NextResponse.redirect(url) // 307 → browser follows to `next`
}
