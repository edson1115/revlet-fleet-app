// components/RoleGate.tsx
'use client';

import { ReactNode, useEffect, useState } from 'react';

type Role = 'ADMIN' | 'OFFICE' | 'DISPATCH' | 'TECH' | 'CUSTOMER' | null;

export default function RoleGate({
  allow,
  children,
  fallback = null
}: {
  allow: Exclude<Role, null>[];
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const [role, setRole] = useState<Role>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch('/api/me')
      .then((r) => r.json())
      .then((m) => setRole((m?.role ?? null) as Role))
      .finally(() => setReady(true));
  }, []);

  if (!ready) return null;
  if (role && allow.includes(role as Exclude<Role, null>)) return <>{children}</>;
  return <>{fallback}</>;
}



