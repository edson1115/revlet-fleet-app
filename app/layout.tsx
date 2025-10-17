// app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import Providers from './providers';
import AppHeader from '@/components/AppHeader';

export const metadata: Metadata = {
  title: 'Revlet Fleet',
  description: 'Fleet service coordination for Office, Dispatch, Tech, and Customers',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <Providers>
          <AppHeader />
          <main className="mx-auto max-w-6xl p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
