export const STATUS_TRANSITIONS: Record<string, string[]> = {
  NEW: ["WAITING"],
  WAITING: ["READY_TO_SCHEDULE"],
  READY_TO_SCHEDULE: ["SCHEDULED"],
  SCHEDULED: ["IN_PROGRESS"],
  IN_PROGRESS: ["COMPLETED"],
};

export function isValidTransition(from: string, to: string) {
  return STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}
