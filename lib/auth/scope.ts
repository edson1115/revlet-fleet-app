// lib/auth/scope.ts
import { supabaseServer } from "@/lib/supabase/server";

export type UserScope = {
  uid: string | null;
  email: string | null;
  role: string; // SUPERADMIN | ADMIN | OFFICE | DISPATCH | TECH | CUSTOMER_USER | UNKNOWN
  company_id: string | null;
  customer_id: string | null;
  markets: string[];
  isSuper: boolean;
  isAdmin: boolean;
  isInternal: boolean;
  isCustomer: boolean;
};

const CUSTOMER_ROLES = new Set(["CUSTOMER_USER", "CUSTOMER", "CLIENT"]);

export async function resolveUserScope(): Promise<UserScope> {
  const sb = await supabaseServer();
  const { data: auth } = await sb.auth.getUser();

  const uid = auth?.user?.id ?? null;
  const email = auth?.user?.email ?? null;

  if (!uid) {
    return {
      uid: null,
      email: null,
      role: "UNKNOWN",
      company_id: null,
      customer_id: null,
      markets: [],
      isSuper: false,
      isAdmin: false,
      isInternal: false,
      isCustomer: false,
    };
  }

  const { data: prof } = await sb
    .from("profiles")
    .select("role, company_id, customer_id")
    .eq("id", uid)
    .maybeSingle();

  const { data: userMarkets } = await sb
    .from("user_markets")
    .select("market")
    .eq("user_id", uid);

  const markets = (userMarkets ?? []).map((m: any) => m.market);

  const role = String(prof?.role || "").toUpperCase();

  const isSuper = role === "SUPERADMIN";
  const isAdmin = isSuper || role === "ADMIN";
  const isInternal = isAdmin || ["OFFICE", "DISPATCH", "TECH"].includes(role);
  const isCustomer = CUSTOMER_ROLES.has(role);

  return {
    uid,
    email,
    role,
    company_id: prof?.company_id ?? null,
    customer_id: prof?.customer_id ?? null,
    markets,
    isSuper,
    isAdmin,
    isInternal,
    isCustomer,
  };
}
