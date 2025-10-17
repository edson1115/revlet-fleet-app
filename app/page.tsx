// app/page.tsx
import Link from 'next/link';
import { supabaseServer } from '@/lib/supabaseServer';

type Role = 'ADMIN' | 'OFFICE' | 'DISPATCH' | 'TECH' | 'CUSTOMER' | null;

async function getRole(): Promise<Role> {
  const sb = await supabaseServer(); // ← MUST await

  // Be defensive: destructure with a fallback so it never throws if shape differs
  const {
    data: { user } = { user: null },
  } = await sb.auth.getUser();

  if (!user) return null;

  const { data } = await sb
    .from('users')
    .select('role')
    .eq('auth_user_id', user.id)
    .single();

  return (data?.role ?? null) as Role;
}

export default async function HomePage() {
  const role = await getRole();

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-semibold mb-4">Revlet Fleet</h1>

      <p className="mb-6 text-slate-700">
        {role
          ? <>You are signed in with role <span className="font-mono">{role}</span>.</>
          : <>You are not signed in.</>}
      </p>

      <nav className="flex flex-wrap gap-3">
        <Link className="rounded border px-3 py-1 hover:bg-slate-50" href="/fm/requests/new">
          Create Request
        </Link>
        <Link className="rounded border px-3 py-1 hover:bg-slate-50" href="/office/queue">
          Office Queue
        </Link>
        <Link className="rounded border px-3 py-1 hover:bg-slate-50" href="/dispatch/scheduled">
          Dispatch
        </Link>
        <Link className="rounded border px-3 py-1 hover:bg-slate-50" href="/tech/queue">
          Tech
        </Link>
        <Link className="rounded border px-3 py-1 hover:bg-slate-50" href="/reports">
          Reports
        </Link>
        <Link className="rounded border px-3 py-1 hover:bg-slate-50" href="/admin">
          Admin
        </Link>
      </nav>
    </main>
  );
}
