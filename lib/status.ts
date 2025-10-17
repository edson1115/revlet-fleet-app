// lib/status.ts
export type RequestStatus =
  | 'NEW'
  | 'WAITING_APPROVAL'
  | 'WAITING_PARTS'
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'RESCHEDULED'
  | 'CANCELED'
  | 'COMPLETED';

export type Role = 'ADMIN' | 'OFFICE' | 'DISPATCH' | 'TECH' | 'CUSTOMER' | null;

export const TERMINAL: RequestStatus[] = ['COMPLETED'];

export const ALLOWED_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  NEW: ['WAITING_APPROVAL', 'WAITING_PARTS'],
  WAITING_APPROVAL: ['WAITING_PARTS'],
  WAITING_PARTS: ['SCHEDULED'],
  SCHEDULED: ['IN_PROGRESS'],
  IN_PROGRESS: ['CANCELED', 'COMPLETED', 'RESCHEDULED'],
  RESCHEDULED: ['SCHEDULED'],
  CANCELED: ['RESCHEDULED'],
  COMPLETED: [],
};

export const ROLE_PERMISSIONS: Record<Role, Partial<Record<RequestStatus, RequestStatus[]>>> = {
  ADMIN: ALLOWED_TRANSITIONS,
  OFFICE: {
    NEW: ['WAITING_APPROVAL', 'WAITING_PARTS'],
    WAITING_APPROVAL: ['WAITING_PARTS'],
    WAITING_PARTS: ['SCHEDULED'],
    SCHEDULED: ['IN_PROGRESS'],
    IN_PROGRESS: ['RESCHEDULED'],
    RESCHEDULED: ['SCHEDULED'],
  },
  DISPATCH: {
    SCHEDULED: ['IN_PROGRESS'],
    IN_PROGRESS: ['RESCHEDULED'],
    RESCHEDULED: ['SCHEDULED'],
  },
  TECH: {
    IN_PROGRESS: ['COMPLETED'],
  },
  CUSTOMER: {},
  null: {},
};

export function canTransition(
  role: Role,
  from: RequestStatus,
  to: RequestStatus,
  options?: { poRequiredForSchedule?: boolean; hasPO?: boolean }
): { ok: boolean; reason?: string } {
  const allowedFrom = ALLOWED_TRANSITIONS[from] || [];
  if (!allowedFrom.includes(to)) {
    return { ok: false, reason: `Illegal transition ${from} → ${to}` };
  }
  const roleMap = ROLE_PERMISSIONS[role ?? null] || {};
  const roleAllowed = (roleMap[from] || []).includes(to);
  if (!roleAllowed && role !== 'ADMIN') {
    return { ok: false, reason: `Role ${role} not permitted for ${from} → ${to}` };
  }
  if (options?.poRequiredForSchedule && to === 'SCHEDULED' && !options?.hasPO && role !== 'ADMIN') {
    return { ok: false, reason: 'PO is required to move to SCHEDULED' };
  }
  return { ok: true };
}

const STATUS_LABELS: Record<RequestStatus, string> = {
  NEW: 'New',
  WAITING_APPROVAL: 'Waiting Approval',
  WAITING_PARTS: 'Waiting for Parts',
  SCHEDULED: 'Scheduled',
  IN_PROGRESS: 'In Progress',
  RESCHEDULED: 'Rescheduled',
  CANCELED: 'Canceled',
  COMPLETED: 'Completed',
};

export function statusLabel(s: RequestStatus | string | null | undefined): string {
  const key = (s ?? 'NEW') as RequestStatus;
  return STATUS_LABELS[key] ?? String(key);
}
