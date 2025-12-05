"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";

type Role =
  | "SUPERADMIN"
  | "ADMIN"
  | "OFFICE"
  | "DISPATCH"
  | "TECH"
  | "FLEET_MANAGER"
  | "CUSTOMER"
  | null;

export default function NavShell({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>(null);

  useEffect(() => {
    (async () => {
      const supabase = supabaseBrowser();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setRole(null);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      setRole((profile?.role as Role) ?? null);
    })();
  }, []);

  // --- FIXED ROLE LOGIC ---
      // -----------------------------------------------------
  // ROLE NORMALIZATION + PERMISSIONS
  // -----------------------------------------------------

  const isAdmin = role === "ADMIN" || role === "SUPERADMIN"; // ⭐ ONLY ONE

  const canOffice = role === "OFFICE" || isAdmin;
  const canDispatch = role === "DISPATCH" || isAdmin;
  const canTech = role === "TECH" || isAdmin;

  const canReports =
    role === "OFFICE" ||
    role === "DISPATCH" ||
    role === "FLEET_MANAGER" ||
    isAdmin;

  // ⭐ FIXED: use `isAdmin` instead of repeating "ADMIN"
  const canFM =
    role === "CUSTOMER" ||
    canOffice ||
    canDispatch ||
    isAdmin;


  return (
    <div className="min-h-screen flex flex-col">
      {/* NAV */}
      <nav className="border-b p-4 bg-white flex gap-4 text-sm">
        <Link href="/">Home</Link>

        {canOffice && <Link href="/office">Office Queue</Link>}
        {canDispatch && <Link href="/dispatch">Dispatch</Link>}
        {canTech && <Link href="/tech">Tech Queue</Link>}
        {canFM && <Link href="/fm">Fleet Manager</Link>}
        {canReports && <Link href="/reports">Reports</Link>}
        {isAdmin && <Link href="/admin">Admin</Link>}
      </nav>

      {/* CONTENT */}
      <main className="flex-1 bg-gray-50">{children}</main>
    </div>
  );
}



