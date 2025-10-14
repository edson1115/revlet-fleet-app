'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function AuthCallbackPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const next = sp.get('next') || '/';

  useEffect(() => {
    (async () => {
      try {
        // Implicit (hash) flow
        if (typeof window !== 'undefined' && window.location.hash) {
          const h = new URLSearchParams(window.location.hash.slice(1));
          const access_token = h.get('access_token');
          const refresh_token = h.get('refresh_token');
          if (access_token && refresh_token) {
            const res = await fetch('/api/auth/token-exchange', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ access_token, refresh_token, next }),
            });
            window.history.replaceState({}, '', window.location.pathname + window.location.search);
            if (res.redirected) {
              window.location.href = res.url;
              return;
            }
          }
        }

        // Code flow
        const code = sp.get('code');
        if (code) {
          const res = await fetch(
            `/api/auth/code-exchange?code=${encodeURIComponent(code)}&next=${encodeURIComponent(
              next,
            )}`,
            { cache: 'no-store' },
          );
          if (res.redirected) {
            window.location.href = res.url;
            return;
          }
        }

        router.replace(next);
      } catch {
        router.replace('/');
      }
    })();
  }, [sp, router, next]);

  return (
    <div className="max-w-md">
      <h1 className="text-xl font-semibold mb-2">Signing you in…</h1>
      <p className="text-sm text-gray-500">Please wait.</p>
    </div>
  );
}
