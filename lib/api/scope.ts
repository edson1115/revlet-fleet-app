// lib/api/scope.ts
import { supabaseServer } from "@/lib/supabase/server";

export type UserScope = {
  uid: string | null;
  email: string | null;
  role: string;
  company_id: string | null;
  customer_id: string | null;
  markets: string[];
  isSuper: boolean;
  isAdmin: boolean;
  isInternal: boolean;
  isCustomer: boolean;
  isTech: boolean;
};

export async function resolveUserScope(): Promise<UserScope> {
  // ❗ DO NOT AWAIT — supabaseServer() is synchronous
  const supabase = supabaseServer();

  // Load current auth session
  const {
    data: { user },
  } = await supabase.auth.getUser().catch(() => ({
    data: { user: null },
  }));

  const uid = user?.id ?? null;
  const email = user?.email ?? null;

  let role = "UNKNOWN";
  let company_id: string | null = null;
  let customer_id: string | null = null;
  let markets: string[] = [];

  // Load profile only when logged in
  if (uid) {
    const { data: prof } = await supabase
      .from("profiles")
      .select("role, company_id, customer_id")
      .eq("id", uid)
      .maybeSingle();

    role = (prof?.role || "UNKNOWN").toUpperCase();
    company_id = prof?.company_id ?? null;
    customer_id = prof?.customer_id ?? null;

    const { data: m } = await supabase
      .from("user_markets")
      .select("market")
      .eq("user_id", uid);

    markets = (m || []).map((x) => x.market);
  }

  // Role helpers
  const isSuper = role === "SUPERADMIN";
  const isAdmin = isSuper || role === "ADMIN";
  const isInternal = ["SUPERADMIN", "ADMIN", "OFFICE", "DISPATCH"].includes(role);
  const isCustomer = ["CUSTOMER", "CUSTOMER_USER"].includes(role);
  const isTech = role === "TECH";

  return {
    uid,
    email,
    role,
    company_id,
    customer_id,
    markets,
    isSuper,
    isAdmin,
    isInternal,
    isCustomer,
    isTech,
  };
}
