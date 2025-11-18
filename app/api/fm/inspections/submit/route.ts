// app/api/fm/inspections/submit/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await supabaseServer();
  const body = await req.json();

  const {
    customer_id,
    recurring_id,
    findings,
    notes,
    photos
  } = body;

  // 1. Insert FM inspection record
  const { data: inspection, error } = await supabase
    .from("fm_inspections")
    .insert({
      customer_id,
      recurring_id,
      checklist: findings,
      notes,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  // 2. Save photos (optional)
  if (photos && Object.keys(photos).length > 0) {
    const rows = [];

    for (const vehicleId in photos) {
      for (const p of photos[vehicleId]) {
        rows.push({
          inspection_id: inspection.id,
          vehicle_id: vehicleId,
          url: p.url,
          kind: p.kind || "INSPECTION",
          created_at: new Date().toISOString(),
        });
      }
    }

    if (rows.length > 0) {
      await supabase.from("fm_inspection_photos").insert(rows);
    }
  }

  // 3. Advance the recurring schedule
  if (recurring_id) {
    await supabase
      .from("recurring_inspections")
      .update({
        last_run: new Date().toISOString(),
      })
      .eq("id", recurring_id);
  }

  return NextResponse.json({ inspection_id: inspection.id });
}
