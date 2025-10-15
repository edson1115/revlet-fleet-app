// app/api/requests/[id]/transition/route.ts
import { getSupabase, json, onError, requireRole } from '@/lib/auth/requireRole';

type Status =
  | 'NEW'
  | 'WAITING_APPROVAL'
  | 'WAITING_PARTS'
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'CANCELED'
  | 'RESCHEDULED'
  | 'COMPLETED';

type Role = 'ADMIN' | 'OFFICE' | 'DISPATCH' | 'TECH' | 'CUSTOMER';

function allowedNextStatuses(current: Status, role: Role): Status[] {
  // Admin/Office: full funnel + PO gate handled separately
  const adminOffice: Record<Status, Status[]> = {
    NEW: ['WAITING_APPROVAL','WAITING_PARTS','SCHEDULED'],
    WAITING_APPROVAL: ['WAITING_PARTS','SCHEDULED','CANCELED'],
    WAITING_PARTS: ['SCHEDULED','CANCELED'],
    SCHEDULED: ['IN_PROGRESS','CANCELED','RESCHEDULED'],
    IN_PROGRESS: ['CANCELED','RESCHEDULED','COMPLETED'],
    CANCELED: ['RESCHEDULED'],
    RESCHEDULED: ['SCHEDULED','CANCELED'],
    COMPLETED: [],
  };

  // Dispatcher: SCHEDULED ↔ IN_PROGRESS ↔ CANCELED/RESCHEDULED/COMPLETED
  const dispatcher: Record<Status, Status[]> = {
    NEW: [],
    WAITING_APPROVAL: [],
    WAITING_PARTS: [],
    SCHEDULED: ['IN_PROGRESS','CANCELED','RESCHEDULED'],
    IN_PROGRESS: ['CANCELED','RESCHEDULED','COMPLETED'],
    CANCELED: ['RESCHEDULED'],
    RESCHEDULED: ['SCHEDULED','CANCELED'],
    COMPLETED: [],
  };

  // Tech: start & finish only
  const tech: Record<Status, Status[]> = {
    NEW: [],
    WAITING_APPROVAL: [],
    WAITING_PARTS: [],
    SCHEDULED: ['IN_PROGRESS'],
    IN_PROGRESS: ['COMPLETED','CANCELED','RESCHEDULED'],
    CANCELED: [],
    RESCHEDULED: [],
    COMPLETED: [],
  };

  if (role === 'ADMIN' || role === 'OFFICE') return adminOffice[current] ?? [];
  if (role === 'DISPATCH') return dispatcher[current] ?? [];
  if (role === 'TECH') return tech[current] ?? [];
  return []; // CUSTOMER cannot transition
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const meta = await requireRole(['ADMIN','OFFICE','DISPATCH','TECH']);
    const supabase = await getSupabase();

    const body = await req.json().catch(() => ({} as any));
    const next_status = (body?.next_status ?? '').trim().toUpperCase() as Status;
    const po_number = (body?.po_number ?? null) as string | null;

    if (!next_status) return json({ error: 'next_status is required' }, 400);

    // Load the request (company scoped)
    const { data: row, error: getErr } = await supabase
      .from('requests')
      .select('id, status, po_number, company_id')
      .eq('id', params.id)
      .eq('company_id', meta.company_id)
      .single();
    if (getErr || !row) return json({ error: 'Not found' }, 404);

    // Role-based transition check
    const allowed = allowedNextStatuses(row.status as Status, meta.role as Role);
    if (!allowed.includes(next_status)) {
      return json({ error: `Transition ${row.status} -> ${next_status} not allowed for role ${meta.role}` }, 403);
    }

    // PO gate: moving to SCHEDULED requires a PO number (provided or existing)
    let finalPo = row.po_number;
    if (next_status === 'SCHEDULED') {
      finalPo = (po_number ?? row.po_number ?? '').trim() || null;
      if (!finalPo) return json({ error: 'PO Number is required to move to SCHEDULED' }, 400);
    }

    // Timestamp updates
    const stamp: Record<string, string | null> = {};
    const now = new Date().toISOString();
    if (next_status === 'SCHEDULED') stamp['scheduled_at'] = now;
    if (next_status === 'IN_PROGRESS') stamp['started_at'] = now;
    if (next_status === 'COMPLETED') stamp['completed_at'] = now;

    const { error: updErr } = await supabase
      .from('requests')
      .update({ status: next_status, po_number: finalPo, ...stamp })
      .eq('id', params.id)
      .eq('company_id', meta.company_id);

    if (updErr) return json({ error: updErr.message }, 500);
    return json({ ok: true, id: params.id, status: next_status, po_number: finalPo });
  } catch (e) {
    return onError(e);
  }
}
