// lib/status.ts

/** UI-facing statuses (authoritative labels shown in dropdowns, filters, etc.) */
export const UI_STATUSES = [
  "NEW",
  "WAITING APPROVAL",
  "WAITING FOR PARTS",
  "WAITING TO BE SCHEDULED",
  "SCHEDULED",
  "DISPATCHED",
  "IN PROGRESS",
  "COMPLETED",
  "DECLINED",
  "RESCHEDULE",           // ← added
] as const;

export type UiStatus = (typeof UI_STATUSES)[number];

/**
 * Map UI label → DB enum
 * NOTE: your DB uses underscored uppercase (WAITING_PARTS, IN_PROGRESS, etc.)
 */
export const UI_TO_DB_STATUS: Record<UiStatus, string> = {
  "NEW": "NEW",
  "WAITING APPROVAL": "WAITING_APPROVAL",
  "WAITING FOR PARTS": "WAITING_PARTS", // keep this since your DB uses WAITING_PARTS
  "WAITING TO BE SCHEDULED": "WAITING_TO_BE_SCHEDULED",
  "SCHEDULED": "SCHEDULED",
  "DISPATCHED": "DISPATCHED",
  "IN PROGRESS": "IN_PROGRESS",
  "COMPLETED": "COMPLETED",
  "DECLINED": "DECLINED",
  "RESCHEDULE": "RESCHEDULE",           // ← added
};

/** Reverse mapping for DB → UI label (shown in tables, drawers, etc.) */
export const DB_TO_UI_STATUS: Record<string, UiStatus> = {
  "NEW": "NEW",
  "WAITING_APPROVAL": "WAITING APPROVAL",
  "WAITING_PARTS": "WAITING FOR PARTS", // DB form → friendly label
  "WAITING_TO_BE_SCHEDULED": "WAITING TO BE SCHEDULED",
  "SCHEDULED": "SCHEDULED",
  "DISPATCHED": "DISPATCHED",
  "IN_PROGRESS": "IN PROGRESS",
  "COMPLETED": "COMPLETED",
  "DECLINED": "DECLINED",
  "RESCHEDULE": "RESCHEDULE",           // ← added
};
