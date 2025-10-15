// app/api/dev/seed/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

/** Admin client (service key). Requires:
 *  - NEXT_PUBLIC_SUPABASE_URL
 *  - SUPABASE_SERVICE_ROLE
 */
function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE!;
  return createClient(url, key, { auth: { persistSession: false } });
}

/** Simple GET so visiting /api/dev/seed in the browser tells you how to run it */
export async function GET() {
  return NextResponse.json({
    ok: false,
    error: 'Use POST /api/dev/seed',
    tip: "From console: fetch('/api/dev/seed', { method: 'POST' }).then(r=>r.json()).then(console.log)",
  });
}

/** POST: seeds a minimal set of rows for the currently picked company.
 *  Requires the cookie `appCompanyId` (log in via /login first).
 */
export async function POST() {
  try {
    // Next.js 15: dynamic cookies() must be awaited
    const ck = await cookies();
    const companyId = ck.get('appCompanyId')?.value;

    if (!companyId) {
      return NextResponse.json(
        { ok: false, error: 'Missing appCompanyId cookie. Log in via /login first.' },
        { status: 400 }
      );
    }

    const supabase = admin();

    // 1) Location upsert (unique by company_id + name)
    const { data: loc, error: locErr } = await supabase
      .from('company_locations')
      .upsert(
        [{ company_id: companyId, name: 'Main Yard' }],
        { onConflict: 'company_id,name' }
      )
      .select()
      .single();

    if (locErr) throw locErr;

    // 2) Vehicle upsert (make sure to satisfy your "vehicle_identifier" check)
    // Use a unique unit_number and a 17-char VIN to be safe
    const { data: veh, error: vehErr } = await supabase
      .from('vehicles')
      .upsert(
        [
          {
            company_id: companyId,
            year: 2018,
            make: 'Ford',
            model: 'Transit',
            vin: 'TESTVIN1234567890', // 17 characters
            unit_number: 'DEV-001',
            // If your table has is_active, this will be accepted; otherwise it’s ignored.
            is_active: true,
          } as any,
        ],
        { onConflict: 'company_id,unit_number' }
      )
      .select()
      .single();

    if (vehErr) throw vehErr;

    // 3) OPTIONAL: seed a single service request
    // IMPORTANT: The enum labels must exist in your DB.
    //   - fmc:             e.g., 'OTHER' (for COD/CC/no FMC)
    //   - service_type:    e.g., 'OIL_CHANGE'
    //   - priority:        e.g., 'NORMAL'
    //   - status:          e.g., 'NEW'
    //
    // If you’re not sure of labels, run in Supabase SQL editor:
    //   select e.enumlabel from pg_enum e
    //   join pg_type t on t.oid = e.enumtypid where t.typname = 'fmc';
    //
    // This block is wrapped in try/catch so a bad enum won’t break the whole seed.
    let requestId: string | null = null;
    try {
      const { data: req, error: reqErr } = await supabase
        .from('service_requests')
        .insert([
          {
            company_id: companyId,
            vehicle_id: veh.id,
            location_id: loc.id,
            fmc: 'OTHER',
            service_type: 'OIL_CHANGE',
            priority: 'NORMAL',
            status: 'NEW',
            customer_notes: 'Seeded job',
          } as any,
        ])
        .select()
        .single();

      if (reqErr) {
        // Don’t fail the endpoint; include a hint in the response.
        console.warn('[seed] service_requests insert skipped:', reqErr.message);
      } else {
        requestId = req.id;
      }
    } catch (e: any) {
      console.warn('[seed] service_requests insert error:', e?.message ?? e);
    }

    return NextResponse.json({
      ok: true,
      message: 'Seed complete.',
      created: {
        location: { id: loc.id, name: loc.name },
        vehicle: { id: veh.id, unit_number: veh.unit_number, vin: veh.vin },
        request: requestId ? { id: requestId } : null,
      },
    });
  } catch (err: any) {
    console.error('[seed] error:', err);
    return NextResponse.json(
      {
        ok: false,
        where: err?.table || undefined,
        error: err?.message || 'Unknown error',
        hint:
          err?.hint ||
          "If this complains about missing columns, run: NOTIFY pgrst, 'reload schema'; in the Supabase SQL editor.",
      },
      { status: 500 }
    );
  }
}
