// app/api/vehicles/route.ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE! // service key for inserts
  return createClient(url, key, { auth: { persistSession: false } })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const {
      year,
      make,
      model,
      vin,
      unit_number,
      plate,
      fmc = 'Other', // default to 'Other' (must match enum casing in DB)
      is_active = true,
    } = body ?? {}

    const ck = await cookies()
    const company_id = ck.get('appCompanyId')?.value
    if (!company_id) {
      return NextResponse.json({ ok: false, error: 'Missing appCompanyId cookie.' }, { status: 400 })
    }

    // Your DB constraint requires VIN or Unit #
    if (!vin && !unit_number) {
      return NextResponse.json(
        { ok: false, error: 'VIN or Unit # is required.' },
        { status: 400 }
      )
    }

    const supabase = admin()

    // Insert the vehicle
    const { data, error } = await supabase
      .from('vehicles')
      .insert({
        company_id,
        year: year ?? null,
        make: make ?? null,
        model: model ?? null,
        vin: vin ?? null,
        unit_number: unit_number ?? null,
        plate: plate ?? null,
        fmc, // enum value must match labels in your DB exactly (e.g., 'Other', 'Holman', 'Element', ...)
        is_active,
      })
      .select('id, year, make, model, unit_number')
      .single()

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 })
    }

    // Build a short label like "2021 Ford Transit (1111)"
    const labelParts = [
      data.year,
      data.make,
      data.model,
      data.unit_number ? `(${data.unit_number})` : undefined,
    ].filter(Boolean)
    const label = String(labelParts.join(' '))

    return NextResponse.json({ ok: true, vehicle: { id: data.id, label } })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? 'Unknown error' }, { status: 500 })
  }
}
