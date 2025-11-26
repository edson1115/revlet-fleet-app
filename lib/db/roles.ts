// lib/db/roles.ts

export type UserRole =
  | "SUPERADMIN"
  | "ADMIN"
  | "OFFICE"
  | "DISPATCH"
  | "TECH"
  | "CUSTOMER_USER";

export function isSuperAdmin(role?: string) {
  return role === "SUPERADMIN";
}

export function isAdmin(role?: string) {
  return role === "ADMIN" || isSuperAdmin(role);
}

export function isOffice(role?: string) {
  return role === "OFFICE";
}

export function isDispatch(role?: string) {
  return role === "DISPATCH";
}

export function isTech(role?: string) {
  return role === "TECH";
}

export function isCustomer(role?: string) {
  return role === "CUSTOMER_USER";
}
