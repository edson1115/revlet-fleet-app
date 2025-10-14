// app/(public)/login/page.tsx
'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function LoginPage() {
  const router = useRouter()
  const sp = useSearchParams()
  const next = sp.get('next') || '/'
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // 1) When returning from the email link, Supabase puts tokens in the hash fragment.
  useEffect(() => {
    // We must read from window.location.hash (client only)
    const hash = typeof window !== 'undefined' ? window.location.hash : ''
    if (!hash || !hash.includes('access_token=')) return

    const params = new URLSearchParams(hash.replace(/^#/, ''))
    const access_token = params.get('access_token')
    const refresh_token = params.get('refresh_token')

    // Clear the hash so refreshing doesn’t re-run this.
    history.replaceState(null, '', window.location.pathname + window.location.search)

    if (!access_token || !refresh_token) {
      setMsg('missing tokens')
      return
    }

    // Send tokens to our API so the server sets Supabase auth cookies
    ;(async () => {
      setBusy(true)
      const res = await fetch('/api/auth/magic', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ access_token, refresh_token, next }),
      })
      setBusy(false)
      if (res.redirected) {
        // NextResponse.redirect will cause a 307; the browser follows it automatically,
        // but Safari sometimes doesn’t. Do a hard push just in case.
        router.replace(res.url)
      } else if (res.ok) {
        router.replace(next)
      } else {
        const j = await res.json().catch(() => ({}))
        setMsg(j?.error || 'Sign-in failed')
      }
    })()
  }, [router, next])

  // 2) Sending the magic link
  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setMsg(null)

    const emailRedirectTo =
      typeof window !== 'undefined'
        ? `${window.location.origin}/login?next=${encodeURIComponent(next)}`
        : undefined

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo },
    })

    setBusy(false)
    if (error) setMsg(error.message)
    else setMsg('Magic link sent. Check your email.')
  }

  return (
    <div className="mx-auto max-w-md p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Sign in</h1>

      {msg && (
        <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
          {msg}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-3">
        <label className="block text-sm">
          <span className="mb-1 block">Email</span>
          <input
            type="email"
            required
            className="w-full rounded border px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
          />
        </label>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={busy}
            className="rounded bg-black px-4 py-2 text-white disabled:opacity-60"
          >
            {busy ? 'Sending…' : 'Send magic link'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="rounded border px-4 py-2"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
