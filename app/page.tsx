// app/page.tsx
'use client';
import Link from 'next/link';

export default function Home() {
  const links = [
    { href: '/fm/requests/new', label: 'Create Service Request' },
    { href: '/office/queue',    label: 'Office — NEW' },
    { href: '/dispatch/scheduled', label: 'Dispatch — Scheduled' },
    { href: '/tech/queue',         label: 'Tech — In Progress' },
  ];

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <h1 className="mb-6 text-2xl font-bold">Revlet Fleet</h1>

      <ul className="grid gap-3 sm:grid-cols-2 max-w-xl">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="block rounded-lg border bg-white px-4 py-3 hover:bg-gray-50"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-8 text-sm text-gray-500">
        Tip: From Office — NEW you can click <em>Schedule now</em> → it moves to Dispatch — Scheduled.
        From Dispatch click <em>Mark In Progress</em> → it moves to Tech — In Progress. In Tech, click <em>Complete</em>.
      </p>
    </main>
  );
}
