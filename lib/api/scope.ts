// lib/api/scope.ts
import { supabaseServer } from "@/lib/supabase/server";

export async function resolveUserScope() {
  const supabase = await supabaseServer();

  /* ============================================================
     AUTH
  ============================================================ */
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      uid: null,
      email: null,
      role: null,

      isSuperadmin: false,
      isAdmin: false,
      isOffice: false,
      isDispatch: false,
      isTech: false,
      isCustomer: false,

      active_market: null,
      customer_id: null,
    };
  }

  /* ============================================================
     PROFILE
  ============================================================ */
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, role, active_market, customer_id")
    .eq("id", user.id)
    .maybeSingle();

  const role = (profile?.role ?? "").toUpperCase();

  /* ============================================================
     CUSTOMER RESOLUTION (CRITICAL FIX)
     - Prefer profiles.customer_id
     - Fallback to customers.user_id
  ============================================================ */
  let customer_id = profile?.customer_id ?? null;

  if (!customer_id && role === "CUSTOMER") {
    const { data: customer } = await supabase
      .from("customers")
      .select("id, market")
      .eq("user_id", user.id)
      .maybeSingle();

    if (customer) {
      customer_id = customer.id;

      // Optional: backfill profile for future speed
      await supabase
        .from("profiles")
        .update({
          customer_id: customer.id,
          active_market: profile?.active_market ?? customer.market ?? "San Antonio",
        })
        .eq("id", user.id);
    }
  }

  return {
    uid: user.id,
    email: user.email ?? profile?.email ?? null,
    role: role || null,

    isSuperadmin: role === "SUPERADMIN",
    isAdmin: role === "ADMIN",
    isOffice: role === "OFFICE",
    isDispatch: role === "DISPATCH",
    isTech: role === "TECH",
    isCustomer: role === "CUSTOMER",

    active_market:
      profile?.active_market ??
      (role === "CUSTOMER" ? "San Antonio" : null),

    customer_id,
  };
}
