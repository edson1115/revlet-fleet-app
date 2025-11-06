// lib/permissions.ts

// ---------- Roles & scope ----------
export type Role =
  | "VIEWER"      // customer portal user
  | "OFFICE"
  | "DISPATCH"
  | "TECH"
  | "SUPERADMIN";

export type Scope = {
  companyId?: string | null;      // tenant/company
  locationIds?: string[] | null;  // markets/locations they can act in
  technicianId?: string | null;   // for TECH scoping
};

// ---------- Normalization ----------
export function normalizeRole(raw?: string | null): Role {
  const r = String(raw || "").trim().toUpperCase();
  if (!r) return "VIEWER";
  if (r === "CUSTOMER") return "VIEWER";
  if (r === "DISPATCHER") return "DISPATCH";
  if (r === "TECHNICIAN") return "TECH";
  if (r === "ADMIN") return "SUPERADMIN"; // if you later want separate ADMIN, split here
  if (["VIEWER","OFFICE","DISPATCH","TECH","SUPERADMIN"].includes(r)) return r as Role;
  return "VIEWER";
}

// ---------- Permissions ----------
export type Permissions = {
  // Navigation visibility
  canSeeCreateRequest: boolean;
  canSeeOffice: boolean;
  canSeeDispatch: boolean;  // OFFICE can see (read-only), DISPATCH/SUPERADMIN can mutate
  canSeeTech: boolean;
  canSeeAdmin: boolean;
  canSeeReports: boolean;

  // Mutations / actions
  canInviteUsers: boolean;       // OFFICE + SUPERADMIN
  canMutateOffice: boolean;      // triage/status grooming, office notes (no scheduling/assign)
  canAssignSchedule: boolean;    // dispatch assign/schedule/reschedule/cancel
  canUploadWorkImages: boolean;  // tech image workflow
  canRequestReschedule: boolean; // tech -> mark RESCHEDULE
  canAddVehicle: boolean;        // viewer/office/dispatch can add within scope

  // Visibility / scoping
  canViewAll: boolean;           // org-wide visibility (SUPERADMIN)
  marketScoped: boolean;         // must filter by locationIds / tenant id
};

export function permsFor(roleInput: string | null | undefined): Permissions {
  const role = normalizeRole(roleInput);

  switch (role) {
    case "SUPERADMIN":
      return {
        canSeeCreateRequest: true,
        canSeeOffice: true,
        canSeeDispatch: true,
        canSeeTech: true,
        canSeeAdmin: true,
        canSeeReports: true,

        canInviteUsers: true,
        canMutateOffice: true,
        canAssignSchedule: true,
        canUploadWorkImages: true,
        canRequestReschedule: true,
        canAddVehicle: true,

        canViewAll: true,
        marketScoped: false,
      };

    case "OFFICE":
      return {
        canSeeCreateRequest: true,
        canSeeOffice: true,
        canSeeDispatch: true,   // 👈 OFFICE can view Dispatch page (read-only)
        canSeeTech: false,
        canSeeAdmin: false,
        canSeeReports: true,

        canInviteUsers: true,
        canMutateOffice: true,
        canAssignSchedule: false,   // still NO scheduling/assign/reschedule/cancel
        canUploadWorkImages: false,
        canRequestReschedule: false,
        canAddVehicle: true,

        canViewAll: false,
        marketScoped: true,
      };

    case "DISPATCH":
      return {
        canSeeCreateRequest: true,
        canSeeOffice: true,        // can view Office queue
        canSeeDispatch: true,
        canSeeTech: false,
        canSeeAdmin: false,
        canSeeReports: true,

        canInviteUsers: false,
        canMutateOffice: false,
        canAssignSchedule: true,   // core dispatch powers
        canUploadWorkImages: false,
        canRequestReschedule: false,
        canAddVehicle: true,

        canViewAll: false,
        marketScoped: true,
      };

    case "TECH":
      return {
        canSeeCreateRequest: false,
        canSeeOffice: false,
        canSeeDispatch: false,
        canSeeTech: true,          // "my jobs"
        canSeeAdmin: false,
        canSeeReports: false,

        canInviteUsers: false,
        canMutateOffice: false,
        canAssignSchedule: false,
        canUploadWorkImages: true,
        canRequestReschedule: true,
        canAddVehicle: false,

        canViewAll: false,
        marketScoped: true,
      };

    case "VIEWER":
    default:
      return {
        canSeeCreateRequest: true, // customer can create requests and add vehicles
        canSeeOffice: false,
        canSeeDispatch: false,
        canSeeTech: false,
        canSeeAdmin: false,
        canSeeReports: false,

        canInviteUsers: false,
        canMutateOffice: false,
        canAssignSchedule: false,
        canUploadWorkImages: false,
        canRequestReschedule: false,
        canAddVehicle: true,

        canViewAll: false,
        marketScoped: true,
      };
  }
}

// ---------- Convenience helpers ----------
export const canViewDispatch = (role?: string | null) => permsFor(role).canSeeDispatch;
export const canMutateDispatch = (role?: string | null) => permsFor(role).canAssignSchedule;
export const canViewOffice = (role?: string | null) => permsFor(role).canSeeOffice;
export const canMutateOffice = (role?: string | null) => permsFor(role).canMutateOffice;
export const canUseAdmin = (role?: string | null) => permsFor(role).canSeeAdmin;
export const canSeeReports = (role?: string | null) => permsFor(role).canSeeReports;
