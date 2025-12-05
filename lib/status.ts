// lib/status.ts

export type UiStatus =
  | "NEW"
  | "WAITING TO BE SCHEDULED"
  | "WAITING APPROVAL"
  | "WAITING FOR PARTS"
  | "SCHEDULED"
  | "IN PROGRESS"
  | "RESCHEDULE"
  | "DISPATCHED"
  | "COMPLETED"
  | "DECLINED";

// These are the labels you show in the UI
export const UI_STATUSES: UiStatus[] = [
  "NEW",
  "WAITING TO BE SCHEDULED",
  "WAITING APPROVAL",
  "WAITING FOR PARTS",
  "SCHEDULED",
  "IN PROGRESS",
  "RESCHEDULE",
  "DISPATCHED",
  "COMPLETED",
  "DECLINED",
];

// Map DB → UI (DB uses underscores)
export const DB_TO_UI_STATUS: Record<string, UiStatus> = {
  NEW: "NEW",
  WAITING_TO_BE_SCHEDULED: "WAITING TO BE SCHEDULED",
  WAITING_APPROVAL: "WAITING APPROVAL",
  WAITING_FOR_PARTS: "WAITING FOR PARTS",
  SCHEDULED: "SCHEDULED",
  IN_PROGRESS: "IN PROGRESS",
  RESCHEDULE: "RESCHEDULE",
  DISPATCHED: "DISPATCHED",
  COMPLETED: "COMPLETED",
  DECLINED: "DECLINED",
};

// Map UI label (or normalized input) → DB value
export const UI_TO_DB_STATUS: Record<UiStatus, string> = {
  "NEW": "NEW",
  "WAITING TO BE SCHEDULED": "WAITING_TO_BE_SCHEDULED",
  "WAITING APPROVAL": "WAITING_APPROVAL",
  "WAITING FOR PARTS": "WAITING_FOR_PARTS",
  "SCHEDULED": "SCHEDULED",
  "IN PROGRESS": "IN_PROGRESS",
  "RESCHEDULE": "RESCHEDULE",
  "DISPATCHED": "DISPATCHED",
  "COMPLETED": "COMPLETED",
  "DECLINED": "DECLINED",
};

// Helpers used by API routes & pages

export function toUiStatus(dbVal?: string | null): UiStatus | string {
  if (!dbVal) return "NEW";
  return DB_TO_UI_STATUS[dbVal] ?? dbVal;
}

/**
 * Normalize any incoming status string to the DB enum:
 * - trims
 * - uppercases
 * - collapses spaces
 * - maps via UI_TO_DB_STATUS
 * - falls back to replacing spaces with underscores
 */
export function toDbStatus(input?: string | null): string | null {
  if (!input) return null;
  const normalized = String(input).trim().toUpperCase().replace(/\s+/g, " ") as UiStatus;

  // Exact UI label match
  if (UI_TO_DB_STATUS[normalized]) {
    return UI_TO_DB_STATUS[normalized];
  }

  // If someone passed already-DB-looking or weird spacing, best effort:
  return normalized.replace(/\s+/g, "_");
}



