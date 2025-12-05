// lib/api/validateStatusChange.ts
import { roleCanSetStatus } from "./statusRules";

export type StatusValidationParams = {
  role: string;
  newStatus: string;
  oldStatus: string;
  techId: string | null;
  notes: string | null;
};

export function validateStatusChange({
  role,
  newStatus,
  oldStatus,
  techId,
  notes,
}: StatusValidationParams): { ok: boolean; error?: string } {
  const s = newStatus.toUpperCase();

  if (!roleCanSetStatus(role, s)) {
    return { ok: false, error: `role ${role} cannot set status ${s}` };
  }

  if (role === "OFFICE" && s === "COMPLETED" && techId) {
    return { ok: false, error: "Office cannot complete a job assigned to a tech" };
  }

  if (role === "TECH" && s === "COMPLETED" && (!notes || notes.trim().length < 2)) {
    return { ok: false, error: "Tech must include notes to complete the job" };
  }

  return { ok: true };
}



