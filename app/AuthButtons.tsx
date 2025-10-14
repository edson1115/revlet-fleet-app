'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AuthButtons() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/me', { cache: 'no-store' });
        const j = await r.json();
        setAuthed(!!j?.authenticated);
      } catch {
        setAuthed(false);
      }
    })();
  }, []);

  if (authed === null) return null;

  if (!authed) {
    return (
      <Link href="/login" className="text-sm">
        Login
      </Link>
    );
  }

  return (
    <button
      type="button"
      className="text-sm"
      disabled={busy}
      onClick={async () => {
        try {
          setBusy(true);
          await fetch('/api/auth/signout', { method: 'POST' });
        } finally {
          window.location.href = '/login';
        }
      }}
    >
      {busy ? 'Signing out…' : 'Logout'}
    </button>
  );
}
