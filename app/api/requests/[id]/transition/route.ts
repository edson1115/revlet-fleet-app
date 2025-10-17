// app/api/requests/[id]/transition/route.ts
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { canTransition, RequestStatus, Role } from '@/lib/status';

async function getUserRole() {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { role: null as Role, user: null };
  const { data } = await sb
    .from('users')
    .select('role')
    .eq('auth_user_id', user.id)
    .single();
  return { role: (data?.role ?? null) as Role, user };
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await req.json().catch(() => ({}))) as { to?: RequestStatus; po_number?: string | null };
    const to = body?.to;
    if (!to) return NextResponse.json({ error: 'Missing target status' }, { status: 400 });

    const sb = supabaseServer();

    // Fetch current row
    const { data: row, error: getErr } = await sb
      .from('service_requests')
      .select('id,status,po_number')
      .eq('id', id)
      .single();
    if (getErr || !row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Role + guard
    const { role } = await getUserRole();
    const guard = canTransition(role, row.status as RequestStatus, to, {
      poRequiredForSchedule: true,
      hasPO: !!(body.po_number || row.po_number),
    });
    if (!guard.ok) return NextResponse.json({ error: guard.reason }, { status: 403 });

    // Compute patch columns
    const patch: Record<string, any> = { status: to };
    const now = new Date().toISOString();
    if (body.po_number && !row.po_number) patch.po_number = body.po_number;
    if (to === 'SCHEDULED') patch.scheduled_at = now;
    if (to === 'IN_PROGRESS') patch.started_at = now;
    if (to === 'COMPLETED') patch.completed_at = now;

    const { error: upErr } = await sb.from('service_requests').update(patch).eq('id', id);
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

    return NextResponse.json({ ok: true, id, to });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Unknown error' }, { status: 500 });
  }
}
