'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Role = 'CUSTOMER' | 'OFFICE' | 'DISPATCH' | 'TECH' | 'ADMIN' | 'FLEET_MANAGER';

export default function Home() {
  const [role, setRole] = useState<Role | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/me', { cache: 'no-store' });
        const j = await r.json();
        setRole(j?.role ?? null);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  if (!loaded) return null;

  const canOffice   = role === 'OFFICE' || role === 'DISPATCH' || role === 'ADMIN' || role === 'FLEET_MANAGER';
  const canDispatch = role === 'DISPATCH' || role === 'ADMIN' || role === 'FLEET_MANAGER';
  const canTech     = role === 'TECH'     || role === 'ADMIN';
  const canFM       = role === 'CUSTOMER' || canOffice || canDispatch || role === 'ADMIN';

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Revlet Fleet</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
        {canFM && (
          <Link href="/fm/requests/new" className="btn btn-ghost block text-left">
            Create Service Request
          </Link>
        )}
        {canOffice && (
          <Link href="/office/queue" className="btn btn-ghost block text-left">
            Office — NEW
          </Link>
        )}
        {canDispatch && (
          <Link href="/dispatch/scheduled" className="btn btn-ghost block text-left">
            Dispatch — Scheduled
          </Link>
        )}
        {canTech && (
          <Link href="/tech/queue" className="btn btn-ghost block text-left">
            Tech — In Progress
          </Link>
        )}
      </div>

      {(role && role !== 'CUSTOMER') && (
        <p className="text-sm text-gray-500 mt-6">
          Tip: From Office — <em>NEW</em> you can click <em>Schedule now</em> → it moves to Dispatch — <em>Scheduled</em>.
          From Dispatch click <em>Mark In Progress</em> → it moves to Tech — <em>In Progress</em>. In Tech, click <em>Complete</em>.
        </p>
      )}
    </div>
  );
}
