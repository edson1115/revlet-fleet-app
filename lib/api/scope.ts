import { supabaseServer } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export async function resolveUserScope() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  // 1. MANUAL TOKEN PARSING (Matches Admin Layout)
  let accessToken = null;
  let userData = null;

  const authCookie = allCookies.find(c => 
    c.name.includes("sb-revlet-auth-token") || c.name.includes("-auth-token")
  );

  if (authCookie) {
    try {
      let rawValue = authCookie.value;
      if (rawValue.startsWith("base64-")) {
        rawValue = Buffer.from(rawValue.replace("base64-", ""), 'base64').toString('utf-8');
      }
      rawValue = decodeURIComponent(rawValue);
      const sessionData = JSON.parse(rawValue);
      accessToken = sessionData.access_token;
      userData = sessionData.user; // User object is usually stored in the cookie session
    } catch (e) {
      console.error("Scope Parse Error:", e);
    }
  }

  // 2. FALLBACK: If cookie parsing fails, return empty
  if (!accessToken || !userData) {
    return emptyScope();
  }

  const supabase = await supabaseServer();

  /* ---------------------------
      PROFILE DATA
  ---------------------------- */
  // We use the ID extracted from the cookie to fetch the profile
  let profile = null;

  const profileRes = await supabase
    .from("profiles")
    .select("id, email, role, active_market, customer_id")
    .eq("id", userData.id)
    .maybeSingle();

  if (!profileRes.error && profileRes.data) {
    profile = profileRes.data;
  }

  // AUTO-HEAL: Create profile if missing
  if (!profile) {
    const { data: newProfile } = await supabase
      .from("profiles")
      .insert({
        id: userData.id,
        email: userData.email,
        role: "TECH", // Defaulting to TECH for your test user context
        active_market: "San Antonio",
      })
      .select()
      .maybeSingle();
    profile = newProfile;
  }

  const role = (profile?.role ?? "").toUpperCase();

  return {
    uid: userData.id,
    email: userData.email ?? profile?.email ?? null,
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