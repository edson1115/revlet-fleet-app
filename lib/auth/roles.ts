export function isSuperAdmin(profile: any) {
  return profile?.role === "SUPERADMIN";
}

export function isOffice(profile: any) {
  return profile?.role === "OFFICE";
}

export function isDispatch(profile: any) {
  return profile?.role === "DISPATCH";
}

export function isTech(profile: any) {
  return profile?.role === "TECH";
}

export function isCustomer(profile: any) {
  return profile?.role === "CUSTOMER_USER";
}
