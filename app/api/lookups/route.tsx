// app/api/lookups/route.ts
import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createServerSupabase();

  const [
    { data: locations, error: locErr },
    { data: vehicles,  error: vehErr },
    { data: customers, error: custErr },
    { data: techs,     error: techErr },
  ] = await Promise.all([
    supabase.from('company_locations').select('id,name').order('name', { ascending: true }),
    supabase.from('vehicles')
      .select('id,year,make,model,unit_number')
      .order('unit_number', { ascending: true, nullsFirst: true })
      .order('year', { ascending: false }),
    supabase.from('customers').select('id,name').order('name', { ascending: true }),
    // TECH users to assign jobs
    supabase.from('app_users').select('id,name,role').eq('role', 'TECH').order('name', { ascending: true }),
  ]);

  if (locErr || vehErr || custErr || techErr) {
    return NextResponse.json(
      { success: false, error: locErr?.message || vehErr?.message || custErr?.message || techErr?.message || 'Lookup query failed' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    locations: locations ?? [],
    vehicles: vehicles ?? [],
    customers: customers ?? [],
    techs: techs ?? [], // ← new
  });
}
