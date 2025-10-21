// app/api/reports/completed/route.ts
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

type RangeOpt = 'today' | '7d';

function rangeToBounds(range: RangeOpt) {
  const now = new Date();
  if (range === 'today') {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return { from: start.toISOString(), to: now.toISOString() };
  }
  const to = now.toISOString();
  const start = new Date(now);
  start.setDate(start.getDate() - 7);
  start.setHours(0, 0, 0, 0);
  return { from: start.toISOString(), to };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const range = (searchParams.get('range') as RangeOpt) || 'today';
  const { from, to } = rangeToBounds(range);

  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from('service_requests')
    .select(`
      id, status, service_type, completed_at, odometer_miles, customer_id,
      vehicles!service_requests_vehicle_id_fkey ( id, year, make, model, unit_number ),
      company_locations!service_requests_location_id_fkey ( id, name ),
      customers!service_requests_customer_id_fkey ( id, name )
    `)
    .eq('status', 'COMPLETED')
    .gte('completed_at', from)
    .lte('completed_at', to)
    .order('completed_at', { ascending: false });

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  const rows = (data || []).map((r: any) => ({
    id: r.id,
    status: r.status,
    service_type: r.service_type,
    completed_at: r.completed_at,
    odometer_miles: r.odometer_miles,
    vehicle: r.vehicles,
    location: r.company_locations,
    customer: r.customers, // ← include for UI/CSV
  }));

  return NextResponse.json({ success: true, rows });
}
