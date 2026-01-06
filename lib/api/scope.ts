import { supabaseServer } from "@/lib/supabase/server";

export async function resolveUserScope() {
  // 1. Get the client (which now has the correct cookieOptions)
  const supabase = await supabaseServer();

  /* ---------------------------
      AUTH
  ---------------------------- */
  // 2. Explicitly get the user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  // DEBUG: If this logs "Auth Error" in your terminal, we know why it fails
  if (authError || !user) {
    if (authError) console.log("Scope Auth Error:", authError.message);
    return emptyScope();
  }

  /* ---------------------------
      PROFILE (SAFE)
  ---------------------------- */
  let profile = null;

  const profileRes = await supabase
    .from("profiles")
    .select("id, email, role, active_market, customer_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profileRes.error && profileRes.data) {
    profile = profileRes.data;
  }

  // 🚑 AUTO-HEAL: create profile if missing
  if (!profile) {
    const insertRes = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        email: user.email,
        role: "OFFICE", // default — adjust if needed
        active_market: "San Antonio",
      })
      .select()
      .maybeSingle();

    profile = insertRes.data ?? null;
  }

  const role = (profile?.role ?? "").toUpperCase();

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

    active_market: profile?.active_market ?? null,
    customer_id: profile?.customer_id ?? null,
  };
}

/* ---------------------------
   HELPERS
---------------------------- */
function emptyScope() {
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