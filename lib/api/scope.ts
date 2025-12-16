// lib/api/scope.ts
import { supabaseServer } from "@/lib/supabase/server";

export async function resolveUserScope() {
  const supabase = await supabaseServer();

  // ------------------------------
  // Load authenticated user
  // ------------------------------
  let user = null;
  try {
    const result = await supabase.auth.getUser();
    user = result?.data?.user ?? null;
  } catch {
    user = null;
  }

  if (!user) {
    return {
      uid: null,
      email: null,
      role: "PUBLIC",
      isCustomer: false,
      isOffice: false,
      isDispatch: false,
      isTech: false,
      isSuperAdmin: false,
      isInternal: false,
      customer_id: null,
      active_market: null,
      markets: [],
    };
  }

  // ------------------------------
  // Load profile
  // ------------------------------
  const { data: profile } = await supabase
    .from("profiles")
    .select("email, role, customer_id, active_market")
    .eq("id", user.id)
    .maybeSingle();

  const role = profile?.role ?? "PUBLIC";
  const customer_id = profile?.customer_id ?? null;
  const active_market = profile?.active_market ?? null;

  const isCustomer = role === "CUSTOMER";
  const isTech = role === "TECH";
  const isOffice = role === "OFFICE";
  const isDispatch = role === "DISPATCH";
  const isSuperAdmin = role === "SUPERADMIN";
  const isInternal = isOffice || isDispatch || isTech || isSuperAdmin;

  return {
    uid: user.id,
    email: profile?.email ?? user.email,
    role,
    customer_id,
    active_market,

    isCustomer,
    isOffice,
    isDispatch,
    isTech,
    isSuperAdmin,
    isInternal,

    markets: active_market ? [active_market] : [],
  };
}
