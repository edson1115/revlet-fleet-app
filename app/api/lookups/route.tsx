// app/api/lookup/route.ts
import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

/**
 * GET /api/lookup
 * Query params (optional):
 *  - company_id: UUID to scope results; defaults to seeded ABC id
 *  - limit: number of vehicles to return (default 500)
 *
 * Returns:
 * {
 *   companyId: string,
 *   vehicles: Array<{ id, year, make, model, vin, unit_number }>,
 *   locations: Array<{ id, name, address, city, state, zip }>
 * }
 */
export async function GET(req: Request) {
  try {
    const supabase = createServerSupabase();
    const url = new URL(req.url);

    const ABC_COMPANY_ID = '00000000-0000-0000-0000-000000000002';
    const companyId = url.searchParams.get('company_id') || ABC_COMPANY_ID;
    const limit = Number(url.searchParams.get('limit') ?? 500);

    const [vehiclesRes, locationsRes] = await Promise.all([
      supabase
        .from('vehicles')
        .select('id, year, make, model, vin, unit_number')
        .eq('company_id', companyId)
        .order('unit_number', { ascending: true, nullsFirst: true })
        .order('year', { ascending: false })
        .limit(limit),
      supabase
        .from('company_locations')
        .select('id, name, address, city, state, zip')
        .eq('company_id', companyId)
        .order('name', { ascending: true }),
    ]);

    if (vehiclesRes.error) {
      return NextResponse.json(
        { error: vehiclesRes.error.message },
        { status: 400 },
      );
    }
    if (locationsRes.error) {
      return NextResponse.json(
        { error: locationsRes.error.message },
        { status: 400 },
      );
    }

    return NextResponse.json({
      companyId,
      vehicles: vehiclesRes.data ?? [],
      locations: locationsRes.data ?? [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Lookup failed' },
      { status: 500 },
    );
  }
}
