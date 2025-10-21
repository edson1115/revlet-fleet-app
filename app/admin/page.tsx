// app/admin/page.tsx
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function normRole(role: string | null | undefined) {
  return (role ?? "").trim().toUpperCase();
}

export default async function AdminHome() {
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id || null;
  if (!uid) redirect("/login");

  const { data: prof } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", uid)
    .maybeSingle();

  if (normRole(prof?.role) !== "ADMIN") redirect("/");

  // Direct to the only current section to avoid duplicate headers/buttons
  redirect("/admin/markets");
}
