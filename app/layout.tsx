import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Revlet Fleet",
  description: "Revlet Fleet – local dev",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* Top nav visible on all pages */}
        <header className="border-b bg-white">
          <nav className="mx-auto flex max-w-6xl items-center gap-3 p-3 text-sm">
            <Link href="/" className="font-semibold">
              Revlet Fleet
            </Link>
            <Link href="/fm/requests/new" className="hover:underline">
              New Request
            </Link>
            <Link href="/office/queue" className="hover:underline">
              Office
            </Link>
            <Link href="/dispatch/scheduled" className="hover:underline">
              Dispatch
            </Link>
            <Link href="/tech/queue" className="hover:underline">
              Tech
            </Link>
          </nav>
        </header>

        {children}
      </body>
    </html>
  );
}
