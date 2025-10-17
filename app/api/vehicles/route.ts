// app/api/vehicles/route.ts
import { getSupabase, json, onError, requireRole } from '@/lib/auth/requireRole';

export async function GET() {
  try {
    const meta = await requireRole(['ADMIN', 'OFFICE', 'DISPATCH', 'TECH']);
    const supabase = await getSupabase();

    const { data, error } = await supabase
      .from('vehicles')
      .select('id, year, make, model, unit_number, vin, plate')
      .eq('company_id', meta.company_id)
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) return json({ error: error.message }, 500);
    return json(data ?? []);
  } catch (e) {
    return onError(e);
  }
}

export async function POST(req: Request) {
  try {
    const meta = await requireRole(['ADMIN', 'OFFICE']);
    const supabase = await getSupabase();
    const body = await req.json();

    // normalize
    const unit_number_raw = (body.unit_number ?? '').trim();
    const unit_number = unit_number_raw.length ? unit_number_raw : null;

    const payload = {
      year: body.year ?? null,
      make: String(body.make ?? '').trim(),
      model: String(body.model ?? '').trim(),
      unit_number,
      vin: (body.vin ?? '').trim() || null,
      plate: (body.plate ?? '').trim() || null,
      company_id: meta.company_id,
      created_at: new Date().toISOString(),
    };

    // optional pre-check: if you want nicer messages without relying on code 23505
    if (unit_number) {
      const { data: exists } = await supabase
        .from('vehicles')
        .select('id')
        .eq('company_id', meta.company_id)
        .ilike('unit_number', unit_number) // case-insensitive match
        .limit(1)
        .maybeSingle();

      if (exists) return json({ error: `Unit number "${unit_number}" already exists for this company.` }, 409);
    }

    const { data, error } = await supabase.from('vehicles').insert(payload).select('id').single();

    if (error) {
      // unique violation
      if ((error as any).code === '23505') {
        return json({ error: `That unit number already exists for this company.` }, 409);
      }
      return json({ error: (error as any).message || 'Insert failed' }, 500);
    }

    return json({ id: data?.id }, 201);
  } catch (e) {
    return onError(e);
  }
}
