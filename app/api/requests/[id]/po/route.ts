// app/api/requests/[id]/po/route.ts
import { getSupabase, json, onError, requireRole } from '@/lib/auth/requireRole';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const meta = await requireRole(['ADMIN', 'OFFICE']);
    const supabase = await getSupabase();
    const body = await req.json();
    const po = (body?.po ?? '').trim();
    if (!po) return json({ error: 'PO is required' }, 400);

    const { error } = await supabase
      .from('requests')
      .update({ po })
      .eq('id', params.id)
      .eq('company_id', meta.company_id);

    if (error) return json({ error: error.message }, 500);
    return json({ ok: true });
  } catch (e) {
    return onError(e);
  }
}
