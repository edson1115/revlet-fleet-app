// app/office/layout.tsx
import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

function normRole(role: string | null | undefined) {
  return (role ?? "").trim().toUpperCase();
}

export default async function OfficeLayout({ children }: { children: ReactNode }) {
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id || null;

  const DEBUG = true; // <— turn ON temporarily

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
  const allowed = role === "OFFICE" || role === "ADMIN";


  if (!allowed) redirect("/");
  return <>{children}</>;
}
