// lib/api/statusRules.ts

export const ALLOWED_STATUS = {
  OFFICE: [
    "WAITING_APPROVAL",
    "WAITING_PARTS",
    "WAITING_FOR_APPROVAL",
    "COMPLETED", // only if no technician assigned
  ],
  DISPATCH: [
    "SCHEDULED",
    "RESCHEDULED",
    "IN_PROGRESS",
  ],
  TECH: [
    "IN_PROGRESS",
    "RESCHEDULED",
    "COMPLETED", // requires notes
  ],
  CUSTOMER: [],
  ADMIN: "ALL",
  SUPERADMIN: "ALL",
} as const;

export function roleCanSetStatus(role: string, targetStatus: string): boolean {
  role = role.toUpperCase();
  targetStatus = targetStatus.toUpperCase();

  if (role === "SUPERADMIN" || role === "ADMIN") return true;

  const allowed = ALLOWED_STATUS[role as keyof typeof ALLOWED_STATUS];
  if (!allowed) return false;
  return Array.isArray(allowed) && allowed.includes(targetStatus);
}



