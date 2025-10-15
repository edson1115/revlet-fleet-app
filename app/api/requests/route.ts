// app/api/requests/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE!;
  return createClient(url, key, { auth: { persistSession: false } });
}

// Map the free-text “Service” field to your enum if you like.
// If you don’t have these enum labels, we’ll default to 'OTHER'.
function normalizeServiceType(input: string | undefined) {
  const v = (input ?? '').trim().toLowerCase();
  if (v.includes('oil')) return 'OIL_CHANGE';
  if (v.includes('tire') || v.includes('tyre')) return 'TIRE_SERVICE';
  if (v.includes('brake')) return 'BRAKE_SERVICE';
  return 'OTHER';
}

export async function POST(req: Request) {
  const ck = await cookies();
  const companyId = ck.get('appCompanyId')?.value;

  if (!companyId) {
    return NextResponse.json(
      { ok: false, error: 'Missing appCompanyId cookie. Log in first.' },
      { status: 400 },
    );
  }

  let body: {
    vehicleId?: string;
    locationId?: string;
    serviceText?: string;
    fmc?: string; // optional override
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Invalid JSON body.' },
      { status: 400 },
    );
  }

  const { vehicleId, locationId, serviceText, fmc } = body;

  if (!vehicleId || !locationId) {
    return NextResponse.json(
      { ok: false, error: 'vehicleId and locationId are required.' },
      { status: 400 },
    );
  }

  // Build the row for service_requests
  // Columns seen earlier: id, company_id, vehicle_id, location_id, fmc, service_type, priority, status, customer_notes, preferred_date_1/2/3
  const row = {
    company_id: companyId,
    vehicle_id: vehicleId,
    location_id: locationId,
    fmc: (fmc ?? 'OTHER') as any,              // your enum includes OTHER; keeps non-FMC jobs easy
    service_type: normalizeServiceType(serviceText) as any,
    priority: 'NORMAL' as any,
    status: 'NEW' as any,
    customer_notes: serviceText ?? null,
  };

  const supabase = admin();
  const { data, error } = await supabase
    .from('service_requests')
    .insert(row)
    .select()
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { ok: false, where: 'service_requests.insert', error: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, created: data });
}

// (Optional) guard other methods so the browser doesn’t throw 405s
export async function GET() {
  return NextResponse.json(
    { ok: false, error: 'Use POST /api/requests' },
    { status: 405 },
  );
}
