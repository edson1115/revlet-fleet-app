export function enforceStatusTransition(
  from: string,
  to: string
) {
  if (from === to) return;

  const allowed = STATUS_TRANSITIONS[from] || [];

  if (!allowed.includes(to)) {
    throw new Error(
      `Illegal status transition: ${from} → ${to}`
    );
  }
}
