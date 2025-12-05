// components/Nav.tsx
import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import SignOutButton from "@/components/SignOutButton";

function normRole(role: string | null | undefined) {
  return (role ?? "").trim().toUpperCase();
}

export default async function Nav() {
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();

  const email = auth.user?.email ?? "";
  let role = "";

  if (auth.user?.id) {
    const { data: prof } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", auth.user.id)
      .maybeSingle();
    role = normRole(prof?.role);
  }

  const canSeeOffice = role === "ADMIN" || role === "OFFICE";
  const isAdmin = role === "ADMIN";

  return (
    <header className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
        {/* Left: Brand + primary links */}
        <div className="flex items-center gap-6">
          <Link href="/" className="font-semibold tracking-tight hover:opacity-80">
            Revlet Fleet
          </Link>

          <nav className="flex items-center gap-5 text-sm">
            <Link href="/" className="hover:opacity-80">Home</Link>
            <Link href="/fm/requests/new" className="hover:opacity-80">Create Request</Link>
            {canSeeOffice && (
              <Link href="/office/queue" className="hover:opacity-80">Office</Link>
            )}
            <Link href="/dispatch/scheduled" className="hover:opacity-80">Dispatch</Link>
            <Link href="/tech/queue" className="hover:opacity-80">Tech</Link>
            <Link href="/reports" className="hover:opacity-80">Reports</Link>
            {isAdmin && <Link href="/admin" className="hover:opacity-80">Admin</Link>}
          </nav>
        </div>

        {/* Right: user/email + role + sign out */}
        <div className="flex items-center gap-3 text-sm">
          {email && <span className="text-gray-600">{email}</span>}
          {role && (
            <span className="px-2 py-0.5 rounded-full border text-xs bg-gray-50">
              {role}
            </span>
          )}
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}



