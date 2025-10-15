// app/api/requests/route.ts
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

/**
 * POST /api/requests
 * Creates a NEW request.
 */
export async function POST(req: Request) {
  try {
    const meta = await requireRole(['ADMIN', 'OFFICE', 'CUSTOMER']);
    const supabase = await getSupabase();

    const body = await req.json().catch(() => ({} as any));
    const vehicle_id = (body?.vehicle_id ?? '').trim();
    const customer_id = (body?.customer_id ?? '').trim();
    const location_id = (body?.location_id ?? '').trim();
    const service = (body?.service ?? '').trim();
    const fmc = (body?.fmc ?? 'Other').trim();
    const mileage = body?.mileage ?? null;

    if (!vehicle_id || !customer_id || !location_id || !service) {
      return json({ error: 'vehicle_id, customer_id, location_id and service are required' }, 400);
    }

    const insert = {
      company_id: meta.company_id,
      vehicle_id,
      customer_id,
      location_id,
      service,
      fmc,
      mileage,
      status: 'NEW' as Status,
    };

    const { data, error } = await supabase
      .from('requests')
      .insert(insert)
      .select('id')
      .single();

    if (error) return json({ error: error.message }, 500);
    return json({ id: data!.id });
  } catch (e) {
    return onError(e);
  }
}

/**
 * GET /api/requests
 * Minimal, rock-solid selector + explicit error surfacing.
 */
export async function GET(req: Request) {
  try {
    const meta = await requireRole(['ADMIN', 'OFFICE', 'DISPATCH', 'TECH', 'CUSTOMER']);
    const supabase = await getSupabase();

    const url = new URL(req.url);
    const status = url.searchParams.get('status') as Status | 'ALL' | null;
    const location_id = url.searchParams.get('location_id');
    const limit = Number(url.searchParams.get('limit') ?? 100);

    // 🔒 Minimal set of columns that every requests table should have
    const SELECT_COLS =
      'id, company_id, vehicle_id, location_id, customer_id, service, status, created_at';

    let q = supabase
      .from('requests')
      .select(SELECT_COLS)
      .eq('company_id', meta.company_id)
      .order('created_at', { ascending: false })
      .limit(Math.min(Math.max(limit, 1), 500));

    if (status && status !== 'ALL') q = q.eq('status', status as Status);
    if (location_id && location_id !== 'ALL') q = q.eq('location_id', location_id);

    if (meta.role === 'CUSTOMER') {
      const customerId = url.searchParams.get('customer_id');
      if (!customerId) return json({ error: 'customer_id is required for CUSTOMER role' }, 400);
      q = q.eq('customer_id', customerId);
    }

    const { data: rows, error } = await q;

    // ⚠️ Surface DB errors to the client so we can see them in the Network tab
    if (error) return json({ error: `[requests.select] ${error.message}` }, 500);

    // hydrate labels (vehicles/locations/customers) best-effort
    const vehicleIds = Array.from(new Set((rows ?? []).map(r => r.vehicle_id).filter(Boolean)));
    const locationIds = Array.from(new Set((rows ?? []).map(r => r.location_id).filter(Boolean)));
    const customerIds = Array.from(new Set((rows ?? []).map(r => r.customer_id).filter(Boolean)));

    const [vehicles, locations, customers] = await Promise.all([
      vehicleIds.length
        ? supabase.from('vehicles').select('id, year, make, model, unit_number').in('id', vehicleIds)
        : Promise.resolve({ data: [] as any[], error: null }),
      locationIds.length
        ? supabase.from('locations').select('id, name').in('id', locationIds)
        : Promise.resolve({ data: [] as any[], error: null }),
      customerIds.length
        ? supabase.from('customers').select('id, name').in('id', customerIds)
        : Promise.resolve({ data: [] as any[], error: null }),
    ]);

    const vehiclesById = Object.fromEntries(((vehicles as any).data ?? []).map((v: any) => [v.id, v]));
    const locationsById = Object.fromEntries(((locations as any).data ?? []).map((l: any) => [l.id, l]));
    const customersById = Object.fromEntries(((customers as any).data ?? []).map((c: any) => [c.id, c]));

    return json({ rows: rows ?? [], vehiclesById, locationsById, customersById });
  } catch (e) {
    return onError(e);
  }
}
