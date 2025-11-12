// lib/permissions.ts

export type Role =
  | "SUPERADMIN"
  | "ADMIN"
  | "OFFICE"
  | "DISPATCH"
  | "TECH"
  | "CUSTOMER"
  | "CUSTOMER_USER"
  | "CUSTOMER_ADMIN"
  | "VIEWER";

export function normalizeRole(input?: string | null): Role {
  const r = String(input || "").trim().toUpperCase();

  if (r === "SUPERADMIN") return "SUPERADMIN";
  if (r === "ADMIN") return "ADMIN";
  if (r === "OFFICE") return "OFFICE";
  if (r === "DISPATCH") return "DISPATCH";
  if (r === "TECH") return "TECH";

  if (r === "CUSTOMER" || r === "CLIENT") return "CUSTOMER";
  if (r === "CUSTOMER_USER") return "CUSTOMER_USER";
  if (r === "CUSTOMER_ADMIN") return "CUSTOMER_ADMIN";

  return "VIEWER";
}

export type Perms = {
  // Nav visibility
  canSeeCreateRequest: boolean;
  canSeeCustomerPortal: boolean;
  canSeeOffice: boolean;
  canSeeDispatch: boolean;
  canSeeTech: boolean;
  canSeeReports: boolean;
  canInviteUsers: boolean;

  // Location behavior
  canChooseAnyLocation: boolean;       // SUPERADMIN
  canChooseScopedLocations: boolean;   // ADMIN (multi-location)
  singleLocationOnly: boolean;         // OFFICE/DISPATCH/TECH/CUSTOMER*/VIEWER
};

export function permsFor(roleRaw?: string | null): Perms {
  const role = normalizeRole(roleRaw);

  const isCustomer =
    role === "CUSTOMER" ||
    role === "CUSTOMER_USER" ||
    role === "CUSTOMER_ADMIN";

  if (role === "SUPERADMIN") {
    return {
      canSeeCreateRequest: true,
      canSeeCustomerPortal: false,
      canSeeOffice: true,
      canSeeDispatch: true,
      canSeeTech: true,
      canSeeReports: true,
      canInviteUsers: true,
      canChooseAnyLocation: true,
      canChooseScopedLocations: false,
      singleLocationOnly: false,
    };
  }

  if (role === "ADMIN") {
    return {
      canSeeCreateRequest: true,
      canSeeCustomerPortal: false,
      canSeeOffice: true,
      canSeeDispatch: true, // enforce view-only in UI/API where needed
      canSeeTech: true,
      canSeeReports: true,
      canInviteUsers: true,          // only within their scoped locations
      canChooseAnyLocation: false,
      canChooseScopedLocations: true,
      singleLocationOnly: false,     // supports multi-location Admin
    };
  }

  if (role === "OFFICE") {
    return {
      canSeeCreateRequest: true,
      canSeeCustomerPortal: false,
      canSeeOffice: true,
      canSeeDispatch: false,
      canSeeTech: false,
      canSeeReports: false,
      canInviteUsers: false,
      canChooseAnyLocation: false,
      canChooseScopedLocations: false,
      singleLocationOnly: true,
    };
  }

  if (role === "DISPATCH") {
    return {
      canSeeCreateRequest: true,
      canSeeCustomerPortal: false,
      canSeeOffice: false,
      canSeeDispatch: true,
      canSeeTech: false,
      canSeeReports: false,
      canInviteUsers: false,
      canChooseAnyLocation: false,
      canChooseScopedLocations: false,
      singleLocationOnly: true,
    };
  }

  if (role === "TECH") {
    return {
      canSeeCreateRequest: false,
      canSeeCustomerPortal: false,
      canSeeOffice: false,
      canSeeDispatch: false,
      canSeeTech: true,
      canSeeReports: false,
      canInviteUsers: false,
      canChooseAnyLocation: false,
      canChooseScopedLocations: false,
      singleLocationOnly: true,
    };
  }

  if (isCustomer) {
    return {
      canSeeCreateRequest: true,
      canSeeCustomerPortal: true,  // My Portal
      canSeeOffice: false,
      canSeeDispatch: false,
      canSeeTech: false,
      canSeeReports: false,
      canInviteUsers: false,
      canChooseAnyLocation: false,
      canChooseScopedLocations: false,
      singleLocationOnly: true,    // implicit location from invite
    };
  }

  // VIEWER / unknown: safe minimal
  return {
    canSeeCreateRequest: true,     // simple public form
    canSeeCustomerPortal: false,
    canSeeOffice: false,
    canSeeDispatch: false,
    canSeeTech: false,
    canSeeReports: false,
    canInviteUsers: false,
    canChooseAnyLocation: false,
    canChooseScopedLocations: false,
    singleLocationOnly: true,
  };
}
