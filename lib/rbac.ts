// lib/rbac.ts
import { supabaseServer } from "@/lib/supabase/server";

export type Role =
  | "SUPERADMIN"
  | "ADMIN"
  | "OFFICE"
  | "DISPATCH"
  | "TECH"
  | "FM"
  | "VIEWER";

export type SessionProfile = {
  user: any;
  role: Role | null;
  company_id: string | null;
};

export async function getSessionProfile(): Promise<SessionProfile> {
  const supabase = await supabaseServer();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const user = session?.user || null;
  const role = (user?.user_metadata?.role as Role) || null;
  const company_id = user?.user_metadata?.company_id || null;

  return { user, role, company_id };
}

export async function requireRole(roles: Role[]) {
  const { role, company_id, user } = await getSessionProfile();
  const ok = !!role && roles.includes(role);
  return { ok, role, company_id, user };
}

export function hasRole(current: Role | null, roles: Role[]) {
  return !!current && roles.includes(current);
}



