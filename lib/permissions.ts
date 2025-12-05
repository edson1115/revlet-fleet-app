// lib/permissions.ts

export type Role =
  | "SUPERADMIN"
  | "ADMIN"
  | "OFFICE"
  | "DISPATCH"
  | "TECH"
  | "FLEET_MANAGER"
  | "CUSTOMER"
  | null;

export function normalizeRole(r: any): Role {
  if (!r) return null;
  const up = String(r).toUpperCase();

  if (
    up === "SUPERADMIN" ||
    up === "ADMIN" ||
    up === "OFFICE" ||
    up === "DISPATCH" ||
    up === "TECH" ||
    up === "FLEET_MANAGER" ||
    up === "CUSTOMER"
  ) {
    return up as Role;
  }

  return null;
}

export function roleToPermissions(role: Role) {
  const base = {
    // Core permissions
    canOfficeQueue:
      role === "OFFICE" || role === "ADMIN" || role === "SUPERADMIN",

    canDispatch:
      role === "DISPATCH" || role === "ADMIN" || role === "SUPERADMIN",

    canTech: role === "TECH" || role === "ADMIN" || role === "SUPERADMIN",

    canReports:
      role === "OFFICE" ||
      role === "DISPATCH" ||
      role === "ADMIN" ||
      role === "SUPERADMIN" ||
      role === "FLEET_MANAGER",

    canFM:
      role === "CUSTOMER" ||
      role === "FLEET_MANAGER" ||
      role === "ADMIN" ||
      role === "SUPERADMIN",

    isAdmin: role === "ADMIN" || role === "SUPERADMIN",
  };

  // UI convenience flags — required by HeaderNav and other components
  return {
    ...base,

    // Create request available to FM + OFFICE + DISPATCH + ADMIN/SUPERADMIN
    canSeeCreateRequest:
      role === "CUSTOMER" ||
      role === "FLEET_MANAGER" ||
      base.canOfficeQueue ||
      base.canDispatch ||
      base.isAdmin,

    // Office Queue link visibility
    canSeeOffice: base.canOfficeQueue || base.isAdmin,

    // Dispatch Queue visibility
    canSeeDispatch: base.canDispatch || base.isAdmin,

    // Tech Queue visibility
    canSeeTech: base.canTech || base.isAdmin,

    // Reports section
    canSeeReports: base.canReports,

    // Fleet Manager Portal
    canSeeFM: base.canFM,
  };
}

export type Permissions = ReturnType<typeof roleToPermissions>;

// Backwards-compat alias
export type Perms = Permissions;



