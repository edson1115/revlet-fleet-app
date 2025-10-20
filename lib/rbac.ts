// lib/rbac.ts
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

type Role = "ADMIN" | "OFFICE" | "DISPATCH" | "TECH" | "FM" | null;

export async function getSessionProfile() {
  const cookieStore = await cookies();
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name: string) => cookieStore.get(name)?.value } }
  );

  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return { role: null as Role, company_id: null as string | null, user: null };

  // profiles: id, email, role, company_id
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, company_id")
    .eq("id", auth.user.id)
    .maybeSingle();

  return {
    role: (profile?.role as Role) ?? null,
    company_id: profile?.company_id ?? null,
    user: auth.user,
  };
}

export async function requireRole(roles: Role[]) {
  const { role, company_id, user } = await getSessionProfile();
  const ok = !!role && roles.includes(role);
  return { ok, role, company_id, user };
}

export async function isAdmin() {
  const { role } = await getSessionProfile();
  return role === "ADMIN";
}

export async function canViewOffice() {
  const { role } = await getSessionProfile();
  return role === "ADMIN" || role === "OFFICE";
}

export async function canViewDispatch() {
  const { role } = await getSessionProfile();
  return role === "ADMIN" || role === "DISPATCH";
}

export async function canViewTech() {
  const { role } = await getSessionProfile();
  return role === "ADMIN" || role === "TECH";
}

export async function canViewFM() {
  const { role } = await getSessionProfile();
  return role === "ADMIN" || role === "FM";
}
