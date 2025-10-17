// app/(public)/login/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

type Role = 'ADMIN' | 'OFFICE' | 'DISPATCH' | 'TECH' | 'CUSTOMER' | null;

const ROLE_LANDING: Record<Exclude<Role, null>, string> = {
  ADMIN: '/admin',
  OFFICE: '/office/queue',
  DISPATCH: '/dispatch/scheduled',
  TECH: '/tech/queue',
  CUSTOMER: '/fm/requests/new'
};

export default function LoginPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get('next');
  const [email, setEmail] = useState('');

  useEffect(() => {
    fetch('/api/me')
      .then((r) => r.json())
      .then((m) => {
        if (m?.authenticated) {
          if (next) router.replace(next);
          else {
            const role = m.role as Role;
            router.replace(role ? ROLE_LANDING[role] : '/');
          }
        }
      })
      .catch(() => {});
  }, [router, next]);

  const onMagic = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = `/api/auth/dev-login?email=${encodeURIComponent(email)}${next ? `&next=${encodeURIComponent(next)}` : ''}`;
    const res = await fetch(url);
    if (res.ok) setTimeout(() => router.refresh(), 300);
  };

  return (
    <main className="mx-auto max-w-sm p-6">
      <h1 className="text-2xl font-semibold mb-4">Sign in</h1>
      <form onSubmit={onMagic} className="space-y-3">
        <input
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded p-2"
        />
        <button className="w-full rounded bg-black text-white py-2">Send magic link (dev)</button>
      </form>
    </main>
  );
}
