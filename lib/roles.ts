// lib/roles.ts
import { supabaseServer } from "@/lib/supabase/server";

export type UserRole = "CUSTOMER" | "OFFICE" | "DISPATCHER" | "TECH";

export async function getSessionContext() {
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth?.user?.id || null;

  let role: UserRole = "CUSTOMER";
  let company_id: string | null = null;

  if (uid) {
    const { data: prof } = await supabase
      .from("profiles")
      .select("role, company_id")
      .eq("id", uid)
      .maybeSingle();
    if (prof?.company_id) company_id = prof.company_id as string;
    if (prof?.role) role = (prof.role as UserRole) || role;
  }

  return { supabase, uid, role, company_id };
}



