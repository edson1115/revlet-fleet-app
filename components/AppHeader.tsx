// components/AppHeader.tsx
import Link from 'next/link';
import { supabaseServer } from '@/lib/supabaseServer';
import { signOutAction } from '@/app/actions/auth'; // <— path now exists

export default async function AppHeader() {
  const sb = await supabaseServer(); // must await

  const {
    data: { user },
  } = await sb.auth.getUser();

  const { data: me } = user
    ? await sb
        .from('users')
        .select('email, role')
        .eq('auth_user_id', user.id)
        .single()
    : { data: null };

  const links = [
    { href: '/', label: 'Home' },
    { href: '/fm/requests/new', label: 'Create Request' },
    { href: '/office/queue', label: 'Office' },
    { href: '/dispatch/scheduled', label: 'Dispatch' },
    { href: '/tech/queue', label: 'Tech' },
    { href: '/reports', label: 'Reports' },
    { href: '/admin', label: 'Admin' },
  ];

  return (
    <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 md:px-6 py-3 flex items-center gap-4">
        <div className="font-semibold">Revlet Fleet</div>

        <nav className="flex flex-wrap items-center gap-3 text-sm">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded px-2 py-1 hover:bg-slate-100"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3 text-sm">
          {me ? (
            <>
              <span className="opacity-70">{me.email}</span>
              <span className="rounded-full border px-2 py-0.5">
                {me.role ?? 'none'}
              </span>
              <form action={signOutAction}>
                <button className="rounded px-2 py-1 border hover:bg-slate-100">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded px-2 py-1 border hover:bg-slate-100"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
