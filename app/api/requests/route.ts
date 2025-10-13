// app/api/requests/route.ts
import { createClient } from '@supabase/supabase-js';

// ---- Server-side Supabase (admin) ----
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// If your seed used fixed IDs, ABC Motors is ...0002; adjust if needed.
const ABC_COMPANY_ID = '00000000-0000-0000-0000-000000000002';

// ---- Types (align with DB) ----
type ReqRow = {
  id: string;
  status: 'NEW' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
  vehicle_id: string | null;
  service_type?: string | null;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | null;
  fmc?: string | null;
  location_id?: string | null;
  customer_notes?: string | null;
  preferred_date_1?: string | null;
  preferred_date_2?: string | null;
  preferred_date_3?: string | null;
  odometer_miles?: number | null;
  scheduled_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  created_at?: string | null;
  company_id?: string | null;
};

type Vehicle = {
  id: string;
  year?: number | null;
  make?: string | null;
  model?: string | null;
  vin?: string | null;
  unit_number?: string | null;
  plate?: string | null;
};

// ---- Helpers ----
const isUUID = (v: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

const coerceDate = (v: any) =>
  typeof v === 'string' && v.trim() !== '' ? v : null;

const coerceNum = (v: any) =>
  v === '' || v === null || typeof v === 'undefined' ? null : Number(v);

// ---- GET /api/requests?status=...&limit=... ----
export async function GET(req: Request) {
  const url = new URL(req.url);
  const status = url.searchParams.get('status') ?? undefined;
  const limit = Number(url.searchParams.get('limit') ?? 50);

  let q = supabaseAdmin
    .from('service_requests')
    .select('*')
    .eq('company_id', ABC_COMPANY_ID) // scope to company
    .order('created_at', { ascending: false })
    .limit(limit);

  if (status) q = q.eq('status', status);

  const { data: rows, error } = (await q) as { data: ReqRow[] | null; error: any };
  if (error) {
    return Response.json({ error: error.message ?? 'Failed to load requests' }, { status: 500 });
  }

  // collect vehicle_ids and fetch minimal vehicles
  const ids = Array.from(
    new Set((rows ?? []).map(r => r.vehicle_id).filter((v): v is string => !!v))
  );

  let vehiclesById: Record<string, Vehicle> = {};
  if (ids.length) {
    const { data: vehicles, error: vErr } = (await supabaseAdmin
      .from('vehicles')
      .select('id, year, make, model, vin, unit_number, plate')
      .in('id', ids)) as { data: Vehicle[] | null; error: any };

    if (!vErr && vehicles) {
      vehiclesById = Object.fromEntries(vehicles.map(v => [v.id, v]));
    }
  }

  return Response.json({ rows: rows ?? [], vehiclesById });
}

// ---- POST /api/requests ----
export async function POST(req: Request) {
  // parse JSON
  let body: any;
  try {
    const ct = req.headers.get('content-type') || '';
    if (!ct.includes('application/json')) {
      return Response.json({ error: 'Invalid content-type' }, { status: 400 });
    }
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // required: vehicle_id (UUID) + service_type
  const vehicle_id_raw = (body?.vehicle_id ?? '').toString().trim();
  if (!vehicle_id_raw) {
    return Response.json({ error: 'vehicle_id is required' }, { status: 400 });
  }
  if (!isUUID(vehicle_id_raw)) {
    return Response.json({ error: 'vehicle_id must be a valid UUID' }, { status: 400 });
  }

  const service_type = (body?.service_type ?? '').toString().trim();
  if (!service_type) {
    return Response.json({ error: 'service_type is required' }, { status: 400 });
  }

  // optional UUIDs ('' → null, invalid → null)
  const normalizeUUID = (v: any) => {
    const s = (v ?? '').toString().trim();
    return s ? (isUUID(s) ? s : null) : null;
  };

  const insertPayload = {
    company_id: ABC_COMPANY_ID,                 // ✅ fix: include company
    vehicle_id: vehicle_id_raw,
    service_type,
    fmc: body.fmc ?? null,
    priority: body.priority ?? 'NORMAL',
    location_id: normalizeUUID(body.location_id),
    customer_notes: body.customer_notes ?? null,
    preferred_date_1: coerceDate(body.preferred_date_1),
    preferred_date_2: coerceDate(body.preferred_date_2),
    preferred_date_3: coerceDate(body.preferred_date_3),
    is_emergency: !!body.is_emergency,
    odometer_miles: coerceNum(body.odometer_miles),
    status: 'NEW',
  };

  const { data, error } = await supabaseAdmin
    .from('service_requests')
    .insert([insertPayload])
    .select('id')
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  return Response.json({ id: data.id });
}
