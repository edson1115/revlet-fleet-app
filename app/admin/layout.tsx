// app/admin/layout.tsx
import { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";

function normRole(role: string | null | undefined) {
  return (role ?? "").trim().toUpperCase();
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id || null;

  const DEBUG = false;

  if (!uid) {
    if (DEBUG) return <div className="p-6 text-sm">Guard: no user</div>;
    redirect("/login");
  }

  const { data: prof, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", uid)
    .maybeSingle();

  const role = normRole(prof?.role);
  const allowed = role === "ADMIN";

  if (DEBUG) {
    return (
      <div className="p-6 text-sm space-y-3">
        <div><b>DEBUG /admin guard</b></div>
        <div>User ID: {uid}</div>
        <div>DB role (raw): {String(prof?.role ?? "NULL")}</div>
        <div>DB role (norm): {role || "—"}</div>
        <div>Allowed: {String(allowed)}</div>
        <div>Error: {error?.message ?? "none"}</div>
        <hr className="my-3" />
        {allowed ? children : <div>Not allowed</div>}
      </div>
    );
  }

  if (!allowed) redirect("/");

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <nav className="flex gap-3">
          <Link
            href="/admin/markets"
            className="px-3 py-1 rounded-xl bg-gray-100 hover:bg-gray-200"
          >
            Markets
          </Link>
          {/* Future: Users / Roles */}
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}
