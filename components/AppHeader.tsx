// components/AppHeader.tsx
import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";

export default async function AppHeader() {
  const sb = await supabaseServer();

  const {
    data: { user },
  } = await sb.auth.getUser();

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 gap-3">
        {/* Brand */}
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Revlet Fleet
        </Link>

        {/* Main nav – adjust links as needed */}
        <nav className="flex items-center gap-4 text-sm text-gray-700">
          <Link href="/office" className="hover:text-black">
            Office
          </Link>
          <Link href="/dispatch" className="hover:text-black">
            Dispatch
          </Link>
          <Link href="/tech" className="hover:text-black">
            Tech
          </Link>
          <Link href="/reports/completed" className="hover:text-black">
            Reports
          </Link>
        </nav>

        {/* User section */}
        <div className="flex items-center gap-3 text-xs text-gray-600">
          {user ? (
            <>
              <span className="max-w-[180px] truncate" title={user.email || ""}>
                {user.email}
              </span>
              {/* You can wire a real sign-out action later */}
            </>
          ) : (
            <Link
              href="/auth/login"
              className="rounded border px-2 py-1 text-xs hover:bg-gray-50"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}



