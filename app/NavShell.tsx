'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import AuthButtons from './AuthButtons';

type Role = 'CUSTOMER' | 'OFFICE' | 'DISPATCH' | 'TECH' | 'ADMIN' | 'FLEET_MANAGER';

export default function NavShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [role, setRole] = useState<Role | null>(null);
  const [authed, setAuthed] = useState<boolean | null>(null);

  const hideNav =
    pathname?.startsWith('/login') ||
    pathname?.startsWith('/activate');

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/me', { cache: 'no-store' });
        const j = await r.json();
        setAuthed(!!j?.authenticated);
        setRole(j?.role ?? null);
      } catch {
        setAuthed(false);
        setRole(null);
      }
    })();
  }, []);

  if (hideNav) return <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>;

  const canOffice   = role === 'OFFICE' || role === 'DISPATCH' || role === 'ADMIN' || role === 'FLEET_MANAGER';
  const canDispatch = role === 'DISPATCH' || role === 'ADMIN' || role === 'FLEET_MANAGER';
  const canTech     = role === 'TECH'     || role === 'ADMIN';
  const canReports  = role === 'OFFICE' || role === 'DISPATCH' || role === 'ADMIN' || role === 'FLEET_MANAGER';
  const canFM       = role === 'CUSTOMER' || canOffice || canDispatch || role === 'ADMIN';
  const isAdmin     = role === 'ADMIN';

  return (
    <>
      <header className="border-b bg-white">
        <nav className="mx-auto max-w-6xl px-4">
          <div className="flex items-center justify-between h-12">
            <Link href="/" className="font-semibold">Revlet</Link>
            {authed === null ? null : (
              <div className="flex items-center gap-5 text-sm">
                {canFM && <Link href="/fm/requests/new">New Request</Link>}
                {canOffice && <Link href="/office/queue">Office</Link>}
                {canDispatch && <Link href="/dispatch/scheduled">Dispatch</Link>}
                {canTech && <Link href="/tech/queue">Tech</Link>}
                {canReports && <Link href="/reports/completed">Reports</Link>}
                {isAdmin && <Link href="/admin/access">Admin</Link>}
                <AuthButtons />
              </div>
            )}
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </>
  );
}
