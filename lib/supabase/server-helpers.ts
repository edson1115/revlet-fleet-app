// lib/supabase/server-helpers.ts
import { normalizeRole } from "@/lib/permissions";
import { supabaseServer } from "@/lib/supabase/server";

export async function getUserAndRole() {
  const supabase = await supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { user: null, role: null };

  const role = normalizeRole(user.user_metadata?.role);
  return { user, role };
}

export const INTERNAL = new Set([
  "OFFICE",
  "DISPATCH",
  "ADMIN",
  "SUPERADMIN",
  "FLEET_MANAGER",
]);
