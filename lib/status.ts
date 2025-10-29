// lib/status.ts

/** UI-facing statuses (authoritative labels) */
export const UI_STATUSES = [
  "NEW",
  "WAITING APPROVAL",
  "WAITING FOR PARTS",
  "WAITING TO BE SCHEDULED",
  "IN PROGRESS",
  "COMPLETED",
  "DECLINED",
] as const;

export type UiStatus = typeof UI_STATUSES[number];

/**
 * Map UI label -> DB enum.
 * We assume your DB uses underscored UPPERCASE (e.g., WAITING_PARTS, IN_PROGRESS).
 * If your DB enum labels differ, adjust the right-hand side accordingly.
 */
export const UI_TO_DB_STATUS: Record<UiStatus, string> = {
  "NEW": "NEW",
  "WAITING APPROVAL": "WAITING_APPROVAL",
  "WAITING FOR PARTS": "WAITING_PARTS",               // map "FOR" -> underscore convention
  "WAITING TO BE SCHEDULED": "WAITING_TO_BE_SCHEDULED",
  "IN PROGRESS": "IN_PROGRESS",
  "COMPLETED": "COMPLETED",
  "DECLINED": "DECLINED",
};

/** Reverse mapping for reads from DB -> UI label shown to users */
export const DB_TO_UI_STATUS: Record<string, UiStatus> = {
  "NEW": "NEW",
  "WAITING_APPROVAL": "WAITING APPROVAL",
  "WAITING_PARTS": "WAITING FOR PARTS",
  "WAITING_TO_BE_SCHEDULED": "WAITING TO BE SCHEDULED",
  "IN_PROGRESS": "IN PROGRESS",
  "COMPLETED": "COMPLETED",
  "DECLINED": "DECLINED",
};
