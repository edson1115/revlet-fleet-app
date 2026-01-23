import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function resolveUserScope() {
  const cookieStore = await cookies();

  // 1. AUTH: Use official client to handle split/large cookies automatically
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          // Scope resolution is generally read-only, but this satisfies the interface
        },
      },
    }
  );

  // This safely reassembles the cookie chunks and validates the user
  const { data: { user }, error } = await supabase.auth.getUser();

  // 2. FALLBACK: If auth fails, return empty
  if (error || !user) {
    return emptyScope();
  }

  /* ---------------------------
      PROFILE DATA
  ---------------------------- */
  let profile = null;

  // Use the same client to fetch the profile
  const profileRes = await supabase
    .from("profiles")
    .select("id, email, role, active_market, customer_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profileRes.error && profileRes.data) {
    profile = profileRes.data;
  }

  // AUTO-HEAL: Create profile if missing
  if (!profile) {
    const { data: newProfile } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        email: user.email,
        role: "CUSTOMER", // Default fallback (safest)
        active_market: "San Antonio",
      })
      .select()
      .maybeSingle();
    profile = newProfile;
  }

  const role = (profile?.role ?? "").toUpperCase();

  return {
    uid: user.id,
    email: user.email ?? profile?.email ?? null,
    role: role || null,

    isSuperadmin: role === "SUPERADMIN" || role === "SUPER_ADMIN",
    isAdmin: role === "ADMIN",
    isOffice: role === "OFFICE",
    isDispatch: role === "DISPATCH",
    isTech: role === "TECH" || role === "TECHNICIAN",
    isCustomer: role === "CUSTOMER",

    active_market: profile?.active_market ?? null,
    customer_id: profile?.customer_id ?? null,
  };
}

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