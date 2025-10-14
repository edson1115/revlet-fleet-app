// app/api/requests/route.ts
import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

// GET /api/requests?status=&limit=&customer_id=&assigned_tech_id=
export async function GET(req: Request) {
  const supabase = createServerSupabase();
  const url = new URL(req.url);
  const status = url.searchParams.get('status') || undefined;
  const limit = Number(url.searchParams.get('limit') || '0');
  const customerId = url.searchParams.get('customer_id') || undefined;
  const assignedTechId = url.searchParams.get('assigned_tech_id') || undefined;

  let q = supabase
    .from('service_requests')
    .select(`
      id, status, service_type, created_at, scheduled_at, started_at, completed_at,
      vehicle_id, location_id, customer_id, assigned_tech_id, odometer_miles,
      vehicles!service_requests_vehicle_id_fkey ( id, year, make, model, unit_number ),
      customers!service_requests_customer_id_fkey ( id, name )
    `)
    .order('created_at', { ascending: false });

  if (status) q = q.eq('status', status);
  if (customerId) q = q.eq('customer_id', customerId);
  if (assignedTechId) q = q.eq('assigned_tech_id', assignedTechId);
  if (limit && Number.isFinite(limit) && limit > 0) q = q.limit(limit);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const vehiclesById: Record<string, any> = {};
  const customersById: Record<string, any> = {};

  for (const r of data ?? []) {
    if (r.vehicles) vehiclesById[r.vehicles.id] = r.vehicles;
    if (r.customers) customersById[r.customers.id] = r.customers;
  }

  const rows = (data ?? []).map((r: any) => ({
    id: r.id,
    status: r.status,
    service_type: r.service_type,
    created_at: r.created_at,
    scheduled_at: r.scheduled_at,
    started_at: r.started_at,
    completed_at: r.completed_at,
    vehicle_id: r.vehicle_id,
    location_id: r.location_id,
    customer_id: r.customer_id,
    assigned_tech_id: r.assigned_tech_id,
    odometer_miles: r.odometer_miles,
  }));

  return NextResponse.json({ rows, vehiclesById, customersById });
}

// POST /api/requests
export async function POST(req: Request) {
  const supabase = createServerSupabase();

  let body: any = null;
  try {
    const ct = req.headers.get('content-type') || '';
    body = ct.includes('application/json') ? await req.json() : null;
  } catch {
    body = null;
  }

  const insert = {
    status: 'NEW',
    service_type: body?.service_type ?? null,
    vehicle_id: body?.vehicle_id ?? null,
    location_id: body?.location_id ?? null,
    customer_id: body?.customer_id ?? null,
  };

  const { data, error } = await supabase.from('service_requests').insert(insert).select('id').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ id: data?.id });
}
