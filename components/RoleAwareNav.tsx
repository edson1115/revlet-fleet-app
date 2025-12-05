// components/RoleAwareNav.tsx
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

type Role = 'ADMIN' | 'OFFICE' | 'DISPATCH' | 'TECH' | 'CUSTOMER' | null;

const NAV: Array<{ href: string; label: string; roles: Exclude<Role, null>[] }> = [
  { href: '/fm/requests/new', label: 'Create Request', roles: ['ADMIN', 'OFFICE', 'CUSTOMER'] },
  { href: '/office/queue',    label: 'Office',         roles: ['ADMIN', 'OFFICE', 'DISPATCH'] },
  { href: '/dispatch/scheduled', label: 'Dispatch',    roles: ['ADMIN', 'DISPATCH'] },
  { href: '/tech/queue',      label: 'Tech',           roles: ['ADMIN', 'TECH'] },
  { href: '/reports',         label: 'Reports',        roles: ['ADMIN', 'OFFICE', 'DISPATCH'] },
  { href: '/admin',           label: 'Admin',          roles: ['ADMIN'] },
];

async function fetchJSONSafe<T = any>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export default function RoleAwareNav() {
  const [role, setRole] = useState<Role>(null);
  const [ready, setReady] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    (async () => {
      const me = await fetchJSONSafe<{ role?: string }>('/api/me');
      const r = (me?.role ?? null) as Role;
      setRole(r);
      setReady(true);
    })();
  }, []);

  if (!ready) {
    // render a lightweight shell to avoid layout shift
    return (
      <header className="border-b bg-white">
        <nav className="mx-auto max-w-6xl flex items-center gap-3 px-4 h-12">
          <span className="font-semibold mr-4">Revlet</span>
        </nav>
      </header>
    );
  }

  // If role unknown (e.g., not logged in), just show Create Request as a safe default
  const items = role
    ? NAV.filter((i) => i.roles.includes(role as Exclude<Role, null>))
    : [{ href: '/fm/requests/new', label: 'Create Request', roles: [] as any }];

  return (
    <header className="border-b bg-white">
      <nav className="mx-auto max-w-6xl flex items-center gap-3 px-4 h-12">
        <Link href="/" className="font-semibold mr-4">Revlet</Link>
        {items.map((i) => {
          const active = pathname === i.href || pathname.startsWith(i.href + '/');
          return (
            <Link
              key={i.href}
              href={i.href}
              className={`px-3 py-1 rounded ${active ? 'bg-black text-white' : 'hover:bg-gray-100'}`}
            >
              {i.label}
            </Link>
          );
        })}
        <div className="ml-auto text-xs text-gray-500">
          {role ? `Role: ${role}` : 'Role: guest'}
        </div>
      </nav>
    </header>
  );
}



