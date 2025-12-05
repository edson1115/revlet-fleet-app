// lib/api/scope.ts
import { supabaseServer } from "@/lib/supabase/server";

export async function resolveUserScope() {
  const supabase = await supabaseServer();

  let user = null;
  try {
    const result = await supabase.auth.getUser();
    user = result?.data?.user ?? null;
  } catch {
    user = null;
  }

  // ---------------------------------------
  // NOT LOGGED IN = PUBLIC USER
  // ---------------------------------------
  if (!user) {
    return {
      uid: null,
      email: null,
      role: "PUBLIC",
      isTech: false,
      isOffice: false,
      isDispatch: false,
      isCustomer: false,
      isSuperAdmin: false,
      isInternal: false,
      readOnlyDispatch: false,
      readOnlyOffice: false,
      markets: [],
    };
  }

  // ---------------------------------------
  // LOAD PROFILE
  // ---------------------------------------
  const { data: profile } = await supabase
    .from("profiles")
    .select("email, role, active_market")
    .eq("id", user.id)
    .maybeSingle();

  const role = profile?.role ?? "PUBLIC";
  const market = profile?.active_market ?? null;

  // ---------------------------------------
  // ROLE FLAGS
  // ---------------------------------------
  const isSuperAdmin = role === "SUPERADMIN";
  const isDispatch = role === "DISPATCH";
  const isOffice = role === "OFFICE";
  const isTech = role === "TECH";
  const isCustomer = role === "CUSTOMER";

  // Shared internal system roles
  const isInternal = isSuperAdmin || isDispatch || isOffice || isTech;

  // READ-ONLY RIGHTS
  const readOnlyDispatch =
    isOffice || isCustomer; // Office can view Dispatch; Customers never see it
  const readOnlyOffice =
    isDispatch || isCustomer; // Dispatch can view Office read-only

  return {
    uid: user.id,
    email: profile?.email ?? user.email,
    role,

    isSuperAdmin,
    isDispatch,
    isOffice,
    isTech,
    isCustomer,

    isInternal,
    readOnlyDispatch,
    readOnlyOffice,

    markets: market ? [market] : [],
  };
}
