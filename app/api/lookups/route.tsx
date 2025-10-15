// app/api/lookups/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

// Use service role on the server so RLS won't block lookups
function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE ??
    process.env.SUPABASE_SERVICE_ROLE_KEY!; // support either env name
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET() {
  const ck = await cookies();
  const companyId = ck.get('appCompanyId')?.value;
  if (!companyId) {
    return NextResponse.json(
      { ok: false, error: 'Missing appCompanyId cookie. Log in via /login first.' },
      { status: 400 }
    );
  }

  const supabase = admin();

  const [
    { data: locations, error: locErr },
    { data: vehicles, error: vehErr },
    { data: customers, error: custErr },
  ] = await Promise.all([
    supabase
      .from('company_locations')
      .select('id,name')
      .eq('company_id', companyId)
      .order('name', { ascending: true }),
    supabase
      .from('vehicles')
      .select('id,year,make,model,unit_number')
      .eq('company_id', companyId)
      .order('unit_number', { ascending: true, nullsFirst: true }),
    supabase
      .from('customers')
      .select('id,name')
      .eq('company_id', companyId)
      .order('name', { ascending: true }),
  ]);

  if (locErr || vehErr || custErr) {
    return NextResponse.json(
      { ok: false, where: 'lookups', error: (locErr ?? vehErr ?? custErr)?.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    locations: locations ?? [],
    vehicles: vehicles ?? [],
    customers: customers ?? [],
  });
}
