// lib/workflow/enforceStatusTransition.ts

/**
 * Defines the allowed state machine transitions for service requests.
 * If these are defined in a separate config file, import them here instead.
 */
const STATUS_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "PENDING", "CANCELLED"],
  COMPLETED: [], // Final state
  CANCELLED: ["PENDING"] // Allow re-opening if cancelled by mistake
};

export function enforceStatusTransition(from: string, to: string) {
  if (from === to) return;

  // Use the local or imported transition map
  const allowed = STATUS_TRANSITIONS[from as keyof typeof STATUS_TRANSITIONS] || [];

  if (!allowed.includes(to)) {
    throw new Error(`Illegal status transition: ${from} → ${to}`);
  }
}