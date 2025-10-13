// app/api/vehicles/route.ts
import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function GET(_req: Request) {
  try {
    const supabase = createServerSupabase();

    const { data, error } = await supabase
      .from('vehicles')
      .select('id, year, make, model, vin, unit_number, plate') // only known-good columns
      .order('unit_number', { ascending: true, nullsFirst: true })
      .order('year', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ vehicles: data ?? [] });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Vehicles fetch failed' },
      { status: 500 },
    );
  }
}

// app/api/vehicles/route.ts (POST only)
export async function POST(req: Request) {
  try {
    const supabase = createServerSupabase();

    let body: any = null;
    try {
      const ct = req.headers.get('content-type') || '';
      body = ct.includes('application/json') ? await req.json() : null;
    } catch { body = null; }

    const p = body || {};
    const ABC_COMPANY_ID = '00000000-0000-0000-0000-000000000002';

    const insertRow = {
      company_id: p.company_id ?? ABC_COMPANY_ID,   // ✅ ensure NOT NULL
      year: p.year ?? null,
      make: p.make ?? null,
      model: p.model ?? null,
      vin: p.vin ?? null,
      unit_number: p.unit_number ?? null,
      plate: p.plate ?? null,
      // location: p.location ?? null, // include only if column exists
    };

    const { data, error } = await supabase
      .from('vehicles')
      .insert(insertRow)
      .select('id')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message ?? 'Vehicle create failed' }, { status: 400 });
    }
    return NextResponse.json({ id: data.id });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Vehicles create failed' }, { status: 500 });
  }
}
