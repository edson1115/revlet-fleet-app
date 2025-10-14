// app/layout.tsx
import './globals.css';
import type { ReactNode } from 'react';
import Linker from './Linker';
import NavShell from './NavShell';

export const metadata = {
  title: 'Revlet Fleet',
  description: 'Fleet service management',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* Maps auth user -> app_users on first login (no-op if already linked) */}
        <Linker />

        {/* Provides header for app pages, hides it on /login (and /activate) */}
        <NavShell>{children}</NavShell>
      </body>
    </html>
  );
}
